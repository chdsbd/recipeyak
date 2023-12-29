from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from django.contrib.contenttypes.fields import GenericRelation
from django.db import models, transaction
from django.db.models import QuerySet
from django.db.models.manager import Manager

from recipeyak.models.base import CommonInfo
from recipeyak.models.invite import Invite
from recipeyak.models.membership import Membership, get_random_ical_id
from recipeyak.models.scheduled_recipe import ScheduledRecipe

if TYPE_CHECKING:
    from django.db.models.manager import RelatedManager

    from recipeyak.models.user import User


class Team(CommonInfo):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    # deprecated
    is_public = models.BooleanField(default=False)
    recipes = GenericRelation("Recipe", related_query_name="owner_team")
    # deprecated
    ical_id = models.TextField(
        default=get_random_ical_id,
        help_text="Secret key used to prevent unauthorized access to schedule calendar.",
    )

    objects = Manager["Team"]()

    class Meta:
        db_table = "core_team"

    def __str__(self) -> str:
        return f"<Team • name: {self.name}, is_public: {self.is_public}>"

    def force_join(
        self,
        user: User,
        level: Literal["admin", "contributor", "read"] = "contributor",
    ) -> Membership:
        with transaction.atomic():
            m, created = Membership.objects.get_or_create(
                team=self, user=user, defaults={"level": level, "is_active": True}
            )
            if not created:
                m.level = level
                m.is_active = True
                m.save()
            # remove existing invite
            if user.has_invite(self):
                # this probably explodes at runtime, but ignoring for now
                Membership.objects.filter(  # type: ignore [attr-defined]
                    user=user
                ).exclude(invite=None).get(team=self).invite.delete()
            return m

    def force_join_admin(self, user: User) -> Membership:
        return self.force_join(user, level=Membership.ADMIN)

    def invite_user(
        self, user: User, creator: User, level: str | None = None
    ) -> Invite:
        """
        Invite user to team

        Adds member to team with is_active=False. Creates associated Invite.
        """
        if level is None:
            level = Membership.CONTRIBUTOR
        return Invite.objects.create_invite(
            email=user.email, team=self, level=level, creator=creator
        )

    def admins(self) -> QuerySet[Membership]:
        return Membership.objects.filter(team=self).filter(
            is_active=True, level=Membership.ADMIN
        )

    def is_member(self, user: User) -> bool:
        return Membership.objects.filter(team=self, user=user, is_active=True).exists()

    def is_contributor(self, user: User) -> bool:
        return Membership.objects.filter(
            team=self, user=user, is_active=True, level=Membership.CONTRIBUTOR
        ).exists()

    def is_admin(self, user: User) -> bool:
        return Membership.objects.filter(
            team=self, user=user, is_active=True, level=Membership.ADMIN
        ).exists()

    def invite_exists(self, email: User | str) -> bool:
        return Membership.objects.filter(team=self, user__email=email).exists()

    membership_set: RelatedManager[Membership]
    scheduledrecipe_set: RelatedManager[ScheduledRecipe]
