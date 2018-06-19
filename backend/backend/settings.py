"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 1.11.4.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import os
from typing import List
import logging

import dj_database_url

logger = logging.getLogger(__name__)


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEBUG = os.getenv('DEBUG') == '1'
CI = os.getenv('CI', False)
PRODUCTION = not DEBUG and not CI
DOCKERBUILD = os.getenv('DOCKERBUILD', False)

logger.info('CI:', CI, 'DEBUG:', DEBUG, 'PRODUCTION:', PRODUCTION, 'DOCKERBUILD', DOCKERBUILD)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
if DEBUG or DOCKERBUILD:
    SECRET_KEY = '+p(5+wb+(l2$@iv!1*3=5xnrw2gvi+l$kuo9s7=u6*)ri4v6as'
else:
    SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

ALLOWED_HOSTS: List[str] = ['.recipeyak.com']

if DEBUG:
    ALLOWED_HOSTS = ['*']

# Replaced with Git SHA during docker build. We use this to track releases via Sentry
GIT_SHA = '<%=GIT_SHA=%>'

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'core.apps.CoreConfig',

    'rest_framework',


    'django.contrib.sites',
    'django.contrib.postgres',

    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.github',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.gitlab',


]

if PRODUCTION and not DOCKERBUILD:
    import raven  # noqa: F401
    RAVEN_CONFIG = {
        'dsn': os.environ['SENTRY_DSN'],
        'release': GIT_SHA,
    }
    INSTALLED_APPS.append('raven.contrib.django.raven_compat')

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'core.auth.permissions.DisallowAny',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
}

# Required for using email and on username. http://django-allauth.readthedocs.io/en/latest/advanced.html
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'  # (="username" | "email" | "username_email)
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = None
ACCOUNT_USER_MODEL_USERNAME_FIELD = None

# https://django-allauth.readthedocs.io/en/latest/providers.html#django-configuration
# Add at least a key for each provider you add to INSTALLED_APPS here
if not DOCKERBUILD:
    SOCIALACCOUNT_PROVIDERS = {
        'google': {
            'SCOPE': [
                'profile',
                'email',
            ],
            'AUTH_PARAMS': {
                'access_type': 'online',
            }
        },
        'github': {
            'SCOPE': [
                'user:email',
            ],
            'URL': os.getenv('OAUTH_GITHUB_REDIRECT_URI', 'http://localhost:3000/accounts/github') if DEBUG else os.environ['OAUTH_GITHUB_REDIRECT_URI'],
        },
        'gitlab': {
            'SCOPE': ['read_user'],
            'URL': os.getenv('OAUTH_GITLAB_REDIRECT_URI', 'http://localhost:3000/accounts/gitlab') if DEBUG else os.environ['OAUTH_GITLAB_REDIRECT_URI'],
        },
    }

SESSION_COOKIE_AGE = 365 * 24 * 60 * 60  # sessions expire in one year

# http://django-rest-auth.readthedocs.io/en/latest/api_endpoints.html#basic
# Require the old password be provided to change a your password
OLD_PASSWORD_FIELD_ENABLED = True

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.http.ConditionalGetMiddleware',
]

if DEBUG:
    MIDDLEWARE.append('backend.middleware.ServerTimingMiddleware')

AUTH_USER_MODEL = 'core.MyUser'

ROOT_URLCONF = 'backend.urls'

API_BASE_URL = 'api/v1'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


if DEBUG or DOCKERBUILD:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_USE_TLS = True
    EMAIL_HOST = os.environ['EMAIL_HOST']
    EMAIL_PORT = os.getenv('EMAIL_PORT', 587)
    EMAIL_HOST_USER = os.environ['EMAIL_HOST_USER']
    EMAIL_HOST_PASSWORD = os.environ['EMAIL_HOST_PASSWORD']
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DATABASES = {}

DATABASES['default'] = dj_database_url.config(conn_max_age=600)


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = '/var/app/static'

# https://docs.djangoproject.com/en/dev/topics/logging/#module-django.utils.log
if PRODUCTION:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'root': {
            'level': 'INFO',
            'handlers': ['sentry', 'console'],
        },
        'formatters': {
            'verbose': {
                'format': 'level=%(levelname)s msg="%(message)s" module=%(module)s '
                          'pathname="%(pathname)s" lineno=%(lineno)s funcname=%(funcName)s '
                          'process=%(process)d thread=%(thread)d '
            },
            'json': {
                '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
                'format': '%(levelname)s "%(message)s" %(module)s '
                          '"%(pathname)s" %(lineno)s %(funcName)s '
                          '%(process)d %(thread)d ',
            }
        },
        'handlers': {
            'sentry': {
                'level': 'WARNING',
                'class': 'raven.contrib.django.raven_compat.handlers.SentryHandler',
                'tags': {'custom-tag': 'x'},
            },
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
                'formatter': 'json'
            }
        },
    }
