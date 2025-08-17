# -*- coding: utf-8 -*-
import logging, json, jwt, random, os
from datetime import datetime, timedelta
from django.shortcuts import render
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from . import models
from django.views import View
from django.http import JsonResponse
from .utils import user_validator, auth_send_email
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView


########## username이 kakao,naver,google이든 회원가입 때 중복되면 생성x
@method_decorator(csrf_exempt, name='dispatch')
class SignUp(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            nickname = data.get("nickname")
            password = data.get("password")

            print(data)
            user = models.User.objects.get_or_none(username=email)
            if user:
                return JsonResponse({"message": "이미 가입되어 있는 사용자입니다."}, status=500)
            else:
                new_user = models.User.objects.create(username=email, nickname=nickname)
                new_user.set_password(password)
                new_user.save()

                vridge_session = jwt.encode(
                    {
                        "user_id": new_user.id,
                        "exp": datetime.utcnow() + timedelta(days=28),
                    },
                    os.environ.get('SECRET_KEY'),
                    os.environ.get('ALGORITHM', 'HS256'),
                )
                res = JsonResponse(
                    {
                        "message": "success",
                        "vridge_session": vridge_session,
                        "user": new_user.username,
                    },
                    status=201,
                )
                res.set_cookie(
                    "vridge_session",
                    vridge_session,
                    samesite="None",
                    secure=True,
                    max_age=2419200,
                )
                return res
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SignIn(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            user = authenticate(request, username=email, password=password)
            if user is not None:
                vridge_session = jwt.encode(
                    {"user_id": user.id, "exp": datetime.utcnow() + timedelta(days=28)},
                    os.environ.get('SECRET_KEY'),
                    os.environ.get('ALGORITHM', 'HS256'),
                )
                res = JsonResponse(
                    {
                        "message": "success",
                        "vridge_session": vridge_session,
                        "user": user.username,
                    },
                    status=201,
                )
                res.set_cookie(
                    "vridge_session",
                    vridge_session,
                    samesite="None",
                    secure=True,
                    max_age=2419200,
                )
                return res
            else:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=403)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SendAuthNumber(View):
    def post(self, request, types):
        try:
            data = json.loads(request.body)
            email = data.get("email")

            auth_number = random.randint(100000, 1000000)

            user = models.User.objects.get_or_none(username=email)

            if types == "reset":
                if user is None:
                    return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=500)

                # All users now use email login only
                user.email_secret = auth_number
                user.save()
            else:
                if user:
                    return JsonResponse({"message": "이미 가입되어 있는 사용자입니다."}, status=500)
                email_verify, is_created = models.EmailVerify.objects.get_or_create(email=email)
                email_verify.auth_number = auth_number
                email_verify.save()

            auth_send_email(request, email, auth_number)

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class EmailAuth(View):
    def post(self, request, types):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            auth_number = data.get("auth_number")

            if types == "reset":
                user = models.User.objects.get_or_none(username=email)

                if not user:
                    return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=500)

                if auth_number == user.email_secret:
                    return JsonResponse({"message": "success"}, status=200)
                else:
                    return JsonResponse({"message": "인증번호가 틀렸습니다."}, status=500)

            else:
                email_verify = models.EmailVerify.objects.get_or_none(email=email)
                if not email_verify:
                    return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=404)
                if email_verify.auth_number == auth_number:
                    email_verify.delete()
                    return JsonResponse({"message": "success"}, status=200)
                else:
                    return JsonResponse({"message": "인증번호가 일치하지 않습니다"}, status=404)

        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ResetPassword(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            user = models.User.objects.get_or_none(username=email)
            if user:
                user.set_password(password)
                user.save()
                return JsonResponse({"message": "success"}, status=200)
            else:
                return JsonResponse({"message": "존재하지 않는 사용자입니다."}, status=403)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


# Social login classes removed - only email login supported


class UserMemo(View):
    @user_validator
    def post(self, request):
        try:
            user = request.user

            data = json.loads(request.body)

            date = data.get("date")

            memo = data.get("memo")
            if date and memo:
                models.UserMemo.objects.create(user=user, date=date, memo=memo)

            return JsonResponse({"message": "success"}, status=200)

        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, id):
        try:
            user = request.user
            memo = models.UserMemo.objects.get_or_none(id=id)

            if memo is None:
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=500)

            if memo.user != user:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            memo.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
