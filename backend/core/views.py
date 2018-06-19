from datetime import datetime, timedelta
import logging
from typing import List, Tuple, Any
import pytz

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, mixins, views
from rest_framework.decorators import detail_route
from django.core.exceptions import ValidationError
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from core.search import search_recipe_queryset

from .response import YamlResponse


from .auth.permissions import (
    IsTeamMember,
    IsTeamAdmin,
    IsTeamAdminOrMembershipOwner,
    IsTeamMemberIfPrivate,
    NonSafeIfMemberOrAdmin,
    HasRecipeAccess,
)

from .models import (
    Recipe,
    Step,
    Ingredient,
    Team,
    Invite,
    MyUser,
    ScheduledRecipe,
)

from .serializers import (
    RecipeExportSerializer,
    RecipeSerializer,
    StepSerializer,
    IngredientSerializer,
    TeamSerializer,
    MembershipSerializer,
    InviteSerializer,
    CreateInviteSerializer,
    RecipeMoveCopySerializer,
    ScheduledRecipeSerializer,
    ScheduledRecipeSerializerCreate,
)

from .utils import combine_ingredients

logger = logging.getLogger(__name__)


def user_active_team_ids(user):
    return user.membership_set.filter(is_active=True).values_list('team')


def add_positions(recipe_steps):
    """Add `position` to step data if missing."""
    missing_position = any(s.get('position') is None for s in recipe_steps)
    if missing_position:
        for i, step in enumerate(recipe_steps):
            step['position'] = i + 10.0
    return recipe_steps


def user_and_team_recipes(user):
    return (Recipe.objects
            .filter(Q(owner_user=user) |
                    Q(owner_team__in=user_active_team_ids(user))))


class RecipeViewSet(viewsets.ModelViewSet):

    serializer_class = RecipeSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        """
        Return recipes user owns or has access to via a team

        We restrict access via this queryset filtering.
        """
        SEARCH_LIMIT = 10
        # get all recipes user has access to
        recipes = user_and_team_recipes(self.request.user)

        # filtering for homepage
        if self.request.query_params.get('recent') is not None:
            return recipes.order_by('-modified')[:3]

        query = self.request.query_params.get('q')
        if query is not None:
            return search_recipe_queryset(recipes, query)[:SEARCH_LIMIT]

        return recipes

    def create(self, request):
        serializer = self.get_serializer(data=request.data)

        # If the client doesn't set the position on one of the objects we need
        # to renumber them all.
        serializer.initial_data['steps'] = add_positions(serializer.initial_data['steps'])
        serializer.initial_data['ingredients'] = add_positions(serializer.initial_data['ingredients'])

        serializer.is_valid(raise_exception=True)

        serializer.save()

        logger.info(f'Recipe created by {self.request.user}')
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @detail_route(
        methods=['post'],
        url_name='move',
        serializer_class=RecipeMoveCopySerializer,
        permission_classes=[HasRecipeAccess, ])
    def move(self, request, pk=None):
        """
        Move recipe from user to another team.
        User should have write access to team to move recipe

        /recipes/<recipe_id>/move
            {'id':<team_id>, type:'team'}
        """
        recipe = self.get_object()
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data['type'] == 'team':
            team = Team.objects.get(id=serializer.validated_data['id'])
            if not (team.is_contributor(request.user) or team.is_admin(request.user)):
                raise PermissionDenied(detail='user must have write permissions')
            recipe.move_to(team)
        elif serializer.validated_data['type'] == 'user':
            user = MyUser.objects.get(id=serializer.validated_data['id'])
            if user != request.user:
                raise PermissionDenied(detail='user must be the same as requester')
            recipe.move_to(user)

        return Response(RecipeSerializer(recipe, context={'request': request}).data, status=status.HTTP_200_OK)

    @detail_route(
        methods=['post'],
        url_name='copy',
        serializer_class=RecipeMoveCopySerializer,
        permission_classes=[HasRecipeAccess, ])
    def copy(self, request, pk=None):
        """
        Copy recipe from user to team.
        Any team member should be able to copy a recipe from the team.
        User should have write access to team to copy recipe
        """
        recipe = self.get_object()
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data['type'] == 'team':
            team = Team.objects.get(id=serializer.validated_data['id'])
            if not (team.is_contributor(request.user) or team.is_admin(request.user)):
                raise PermissionDenied(detail='user must have write permissions')
            new_recipe = recipe.copy_to(team)
        elif serializer.validated_data['type'] == 'user':
            user = MyUser.objects.get(id=serializer.validated_data['id'])
            if user != request.user:
                raise PermissionDenied(detail='user must be the same as requester')
            new_recipe = recipe.copy_to(user)

        return Response(RecipeSerializer(new_recipe, context={'request': request}).data, status=status.HTTP_200_OK)


class StepViewSet(viewsets.ModelViewSet):

    queryset = Step.objects.all()
    serializer_class = StepSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request, recipe_pk=None):
        """
        create the step and attach it to the correct recipe
        """
        serializer = self.serializer_class(data=request.data)
        # TODO: Use get_object_or_404 when Soft Delete is removed
        recipe = Recipe.objects.get(pk=recipe_pk)

        # set a position if not provided
        last_step = recipe.steps.last()
        if serializer.initial_data.get('position') is None:
            if last_step is not None:
                serializer.initial_data['position'] = last_step.position + 10.0
            else:
                serializer.initial_data['position'] = 10.0

        if serializer.is_valid():
            serializer.save(recipe=recipe)
            logger.info(f'Step created by {self.request.user}')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ShoppingListView(views.APIView):

    permission_classes = (IsAuthenticated,)

    def get(self, request) -> Response:
        start = request.query_params.get('start')
        end = request.query_params.get('end')

        try:
            scheduled_recipes = (request.user.scheduled_recipes
                                 .filter(on__gte=start)
                                 .filter(on__lte=end))
        except (ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        ingredients: List[Ingredient] = []
        for scheduled_recipe in scheduled_recipes:
            for _ in range(scheduled_recipe.count):
                ingredients += scheduled_recipe.recipe.ingredients

        return Response(combine_ingredients(ingredients), status=status.HTTP_200_OK)


class IngredientViewSet(viewsets.ModelViewSet):

    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request, recipe_pk=None):
        """
        create the ingredient and attach it to the correct recipe
        """
        serializer = self.serializer_class(data=request.data)
        recipe = get_object_or_404(Recipe, pk=recipe_pk)

        # set a position if not provided
        last_ingredient = recipe.ingredients.last()
        if serializer.initial_data.get('position') is None:
            if last_ingredient is not None:
                serializer.initial_data['position'] = last_ingredient.position + 10.0
            else:
                serializer.initial_data['position'] = 10.0

        if serializer.is_valid():
            recipe = Recipe.objects.get(pk=recipe_pk)
            serializer.save(recipe=recipe)
            logger.info(f'Ingredient created by {self.request.user}')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserStats(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, format=None) -> Response:
        user_recipes = Recipe.objects.filter(owner_user=request.user)

        total_recipe_edits = user_recipes \
            .aggregate(total=Sum('edits')) \
            .get('total')

        last_week = datetime.now(tz=pytz.UTC) - timedelta(days=7)

        new_recipes_last_week = user_recipes \
            .filter(created__gt=last_week).count()

        last_month = datetime.now(tz=pytz.UTC) - timedelta(days=30)

        total_recipes_added_last_month_by_all_users = Recipe.objects \
            .filter(created__gte=last_month) \
            .count()

        recipes_added_by_month = user_recipes \
            .annotate(month=TruncMonth('created')) \
            .values('month') \
            .annotate(c=Count('id')) \
            .order_by()

        recipes_pie_not_pie = Recipe.objects \
            .filter(name__search='pie') \
            .count()

        total_recipes = Recipe.objects.count()

        date_joined = request.user.created.strftime('%b, %Y')

        logger.info(f'UserStats fetched by {request.user}')

        return Response({
            'total_user_recipes': user_recipes.count(),
            'total_recipe_edits': total_recipe_edits,
            'new_recipes_last_week': new_recipes_last_week,
            'date_joined': date_joined,
            'recipes_pie_not_pie': (recipes_pie_not_pie, total_recipes),
            'recipes_added_by_month': recipes_added_by_month,
            'total_recipes_added_last_month_by_all_users': total_recipes_added_last_month_by_all_users,
        })


class TeamViewSet(viewsets.ModelViewSet):
    """
    Team viewset for /t/<team>

    Retrieve - Anyone if public, otherwise only members
    List - Anyone if public, otherwise only members
    Destroy - Only TeamAdmins can destroy
    Update - Only TeamAdmins can update
    """
    serializer_class = TeamSerializer

    def get_queryset(self):
        return Team.objects.filter(membership__user__id=self.request.user.id) | Team.objects.filter(is_public=True)

    def get_permissions(self):
        permission_classes: Tuple[Any, ...]
        if self.action in ('retrieve', 'list', 'create'):
            permission_classes = (IsAuthenticated,)
        else:
            permission_classes = (IsAuthenticated, IsTeamAdmin,)
        return [permission() for permission in permission_classes]

    def create(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        team = serializer.save()
        team.force_join_admin(request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MembershipViewSet(
        viewsets.GenericViewSet,
        mixins.RetrieveModelMixin,
        mixins.ListModelMixin,
        mixins.DestroyModelMixin,
        mixins.UpdateModelMixin):
    """
    Member viewset for /t/<team>/members

    Retrieve - Only TeamMembers can list all members
    List - Only TeamMembers can list all members
    Destroy - TeamAdmins and specific member can destroy members
    Update - Only TeamAdmins can update members
    """

    serializer_class = MembershipSerializer

    def get_queryset(self):
        team = get_object_or_404(Team.objects.all(), pk=self.kwargs['team_pk'])
        return team.membership_set.all()

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            permission_classes = (IsAuthenticated, IsTeamMember,)
        elif self.request.method == 'DELETE':
            permission_classes = (IsAuthenticated, IsTeamAdminOrMembershipOwner,)
        else:
            permission_classes = (IsAuthenticated, IsTeamAdmin,)
        return [permission() for permission in permission_classes]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ValueError as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamInviteViewSet(viewsets.GenericViewSet,
                        mixins.CreateModelMixin,
                        mixins.DestroyModelMixin):
    """
    Invite viewset for /t/<team-name>/invites

    Retrieve - return specific invite for the team
    List - return all invites for the team
    Create - create new invite
    Destroy - remove existing invite
    """
    serializer_class = InviteSerializer
    permission_classes = (IsAuthenticated, IsTeamMember,)

    def get_queryset(self):
        team_pk = self.kwargs['team_pk']
        return Invite.objects.filter(membership__team__id=team_pk)

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateInviteSerializer
        return InviteSerializer

    def create(self, request, team_pk=None):
        """
        for creating, we want: level, user_id
        for response, we want: id, user data, team
        We want id, user object, and team data response
        need to use to_representation or form_represenation
        """
        team = Team.objects.get(pk=team_pk)
        serializer = self.get_serializer(data={**request.data, 'team': team})
        serializer.is_valid(raise_exception=True)
        invite = serializer.save(team=team, creator=self.request.user)
        return Response(InviteSerializer(invite, many=True).data, status=status.HTTP_201_CREATED)


class UserInvitesViewSet(viewsets.GenericViewSet,
                         mixins.RetrieveModelMixin,
                         mixins.ListModelMixin):
    """
    Personal route that lists all of a users invites via `/invites`

    Retrieve - return specific invite for user
    List - return all invites user

    Detail routes
    `invites/<id>/accept` - post to accept invite
    `invites/<id>/decline` - post to decline invite
    """
    serializer_class = InviteSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Invite.objects.filter(membership__user=self.request.user)

    @detail_route(methods=['post'], url_name='accept')
    def accept(self, request, pk=None):
        invite = self.get_object()
        invite.accept()
        return Response({'detail': 'accepted invite'}, status=status.HTTP_200_OK)

    @detail_route(methods=['post'])
    def decline(self, request, pk=None):
        invite = self.get_object()
        invite.decline()
        return Response({'detail': 'declined invite'}, status=status.HTTP_200_OK)


class TeamRecipesViewSet(
        viewsets.GenericViewSet,
        mixins.RetrieveModelMixin,
        mixins.DestroyModelMixin,
        mixins.UpdateModelMixin):

    serializer_class = RecipeSerializer
    permission_classes = (IsAuthenticated,
                          IsTeamMemberIfPrivate,
                          NonSafeIfMemberOrAdmin)

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        team = get_object_or_404(Team, pk=self.kwargs['team_pk'])
        return Recipe.objects.filter(owner_team=team)

    def list(self, request, team_pk=None):
        serializer = self.get_serializer(self.get_queryset(),
                                         many=True,
                                         fields=('id', 'name', 'author', 'tags',))
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, team_pk=None):
        team = get_object_or_404(Team.objects.all(), pk=team_pk)

        serializer = self.get_serializer(data=request.data)
        serializer.initial_data['steps'] = add_positions(serializer.initial_data['steps'])
        serializer.initial_data['ingredients'] = add_positions(serializer.initial_data['ingredients'])

        serializer.is_valid(raise_exception=True)

        serializer.save(team=team)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReportBadMerge(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, format=None):
        user = request.user
        logger.warn(f'bad combine for user: {user} with recipes: {user.scheduled_recipes}')
        return Response(status=status.HTTP_201_CREATED)


class CalendarViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduledRecipeSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (ScheduledRecipe.objects
                .filter(user=self.request.user))

    def create(self, request):
        # use different create serializer since we create via primary key, and
        # return an objects
        serializer = ScheduledRecipeSerializerCreate(data=request.data)
        serializer.is_valid(raise_exception=True)

        n = serializer.save(user=request.user)
        return Response(self.get_serializer(n).data, status=status.HTTP_201_CREATED)

    def list(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        try:
            queryset = (self.get_queryset()
                            .filter(on__gte=start)
                            .filter(on__lte=end))
        except (ValueError, ValidationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(queryset,
                                         many=True,)
        return Response(serializer.data, status=status.HTTP_200_OK)


@require_http_methods(["GET"])
@login_required(login_url='/login/')
def export_recipes(request, filetype, id=None):

    queryset = user_and_team_recipes(request.user)

    many = id is None

    if not many:
        queryset = get_object_or_404(queryset, pk=int(id))

    recipes = RecipeExportSerializer(
        queryset,
        many=many).data

    if filetype in ('yaml', 'yml'):
        return YamlResponse(recipes)

    if filetype == 'json':
        # we need safe=False so we can serializer both lists and dicts
        return JsonResponse(recipes, json_dumps_params={'indent': 2}, safe=False)

    raise Http404('unknown export filetype')
