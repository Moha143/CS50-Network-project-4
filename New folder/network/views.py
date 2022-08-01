from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse, HttpResponseNotFound
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
import json
from .models import User, Post


def index(request):
    return HttpResponseRedirect(reverse("allposts"))


def all_posts(request):
    return render(request, "network/posts.html", {
        "following": False
    })


def following(request):
    return render(request, "network/posts.html", {
        "following": True
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        first = request.POST["first"]
        last = request.POST["last"]
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.first_name = first
            user.last_name = last
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def profile(request, username):
    ''' GET request shows profile, PUT request toggles following status of request user on profile user '''
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return HttpResponseNotFound(f"<h1>User '{username}' does not exist</h1>")
    if request.method == 'GET':
        return render(request, "network/profile.html", {
                "profile_user": user
            })
    elif request.method == 'PUT':
        follower = User.objects.get(pk=request.user.id)
        # Toggle following status
        if follower in user.followers.all():
            follower.following.remove(user)
            message = f"You stopped following '{user.username}'."
        else:
            follower.following.add(user)
            message = f"You are now following '{user.username}'."
        return JsonResponse({
            "message": message,
            "followers": user.followers.count(),
            "following": user.following.count()
        }, status=201)
    # Profile must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

# API calls
@login_required
def api_create_post(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = User.objects.get(pk=request.user.id)
        text = data["body"]
        if text == "" or len(text) > 200:
            return JsonResponse({
                "error": f"Invalid length of text. Must be 1 to 200 characters long."
            }, status=400)
        post = Post(user=user, body=text)
        post.save()
        return JsonResponse({
            "post": post.serialize()
        }, status=201)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


@login_required
def api_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return HttpResponseNotFound(f"<h1>Post {post_id} does not exist</h1>")
    except User.DoesNotExist:
        return HttpResponseNotFound(f"<h1>User {request.user.id} does not exist</h1>")

    if request.method == 'GET':
        return JsonResponse({
            "post": post.serialize()
        }, status=201)

    if request.method == 'PUT':
        if request.user.id != post.user.id:
            return JsonResponse({
                "error": f"User is different than author of post, edition is forbidden."
            }, status=403)
        data = json.loads(request.body)
        text = data["new_body"]
        if text == "" or len(text) > 200:
            return JsonResponse({
                "error": f"Invalid length of text. Must be 1 to 200 characters long."
            }, status=400)
        post.body = text
        post.save()
        return JsonResponse({
            "post": post.serialize()
        }, status=201)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


@login_required
def api_like_post(request, post_id):
    if request.method == 'PUT':
        user = User.objects.get(pk=request.user.id)
        try:
            post = Post.objects.get(pk=post_id)
            # Toggle following status
            if user in post.likers.all():
                post.likers.remove(user)
                message = f"Unliked post."
            else:
                post.likers.add(user)
                message = f"Liked post."
            return JsonResponse({
                "message": message,
                "likes": post.likers.count(),
            }, status=201)
        except Post.DoesNotExist:
            return HttpResponseNotFound(f"<h1>Post does not exist</h1>")
    # Like must be via PUT
    else:
        return JsonResponse({
            "error": "PUT request required."
        }, status=400)


def api_all_posts(request):
    posts = Post.objects.order_by("-timestamp").all()
    paginator = Paginator(posts, 10)  # Show 10 posts per page.
    page_number = int(request.GET.get('page')) or 1
    page_obj = paginator.get_page(page_number)
    return JsonResponse({
        'posts': [p.serialize() for p in page_obj.object_list],
        'current_page': page_number,
        'page_range': [x for x in paginator.page_range],
    }, safe=False)

@login_required
def api_all_user_posts(request, username):
    # Get all user posts in reverse chronologial order
    try:
        user = User.objects.get(username=username)
        posts = Post.objects.order_by("-timestamp").filter(user=user)
        paginator = Paginator(posts, 5)  # Show 5 posts per page.
        page_number = int(request.GET.get('page')) or 1
        page_obj = paginator.get_page(page_number)
        return JsonResponse({
            'posts': [p.serialize() for p in page_obj.object_list],
            'current_page': page_number,
            'page_range': [x for x in paginator.page_range],
        }, safe=False)
    except User.DoesNotExist:
        return JsonResponse({
            "error": "User does not exist"
        }, status=404)

@login_required
def api_following_posts(request):
    try:
        user = User.objects.get(pk=request.user.id)
        posts = Post.objects.order_by("-timestamp").filter(user__in=user.following.all())
        paginator = Paginator(posts, 10)  # Show 10 posts per page.
        page_number = int(request.GET.get('page')) or 1
        page_obj = paginator.get_page(page_number)
        return JsonResponse({
            'posts': [p.serialize() for p in page_obj.object_list],
            'current_page': page_number,
            'page_range': [x for x in paginator.page_range],
        }, safe=False)
    except User.DoesNotExist:
        return JsonResponse({
            "error": "User does not exist"
        }, status=404)

