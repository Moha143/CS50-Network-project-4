const username = JSON.parse(document.getElementById('username').textContent);

export async function create_post(body){
    const new_post = await fetch(`/post/create`, {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({
            body: body
        }),
        headers: {
            "X-CSRFToken": get_crsf_token(),
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
    })
    .then( response  => {
        return response.json();
    })
    .catch( error => {
        console.log(error);
    })
    return new_post;
}


export async function toggle_following(profile_username){
    const user_counts = await fetch(`/profile/${profile_username}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
            "X-CSRFToken": get_crsf_token(),
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
    })
    .then( response  => {
        if(response.status === 201) {
            return response.json();
        }
    })
    .catch( error => {
        console.log(error);
    })
    return user_counts;
}

function get_crsf_token(){
   return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

export async function get_all_posts(page_number = 1){
    const posts = await fetch(`/posts/all?page=${page_number}`)
    .then( response  => response.json())
    .catch( error => {
        console.log(error);
    })
    return posts;
}
export async function get_following_posts(page_number = 1){
    const posts = await fetch(`/posts/following?page=${page_number}`)
    .then( response  => response.json())
    .catch( error => {
        console.log(error);
    })
    return posts;
}

export async function get_user_posts(username, page_number = 1){
    const posts = await fetch(`/posts/${username}?page=${page_number}`)
    .then( response  => response.json())
    .catch( error => {
        console.log(error);
    })
    return posts;
}

export function render_html(post){
    let div = document.createElement('div');
    div.className ="post row mb-3";
    const liked_by_user = post.likers.includes(username) ? "liked" : "unliked";
    if(post.user === username ) {
        div.innerHTML = `<div data-postid="${post.id}">
                            <a href="/profile/${post.user}">@<b>${post.user}</b></a><label class="timestamp">${post.timestamp}</label>
                            <span class="edit-btn" aria-label="Edit">&#128393;</span>                         
                            <pre>${post.body}</pre>
                            <div class="container-fluid">
                                <div class="row justify-content-between">
                                    <span class="col like-btn ${liked_by_user}"></span>                                    
                                    <span class="col likes-count-span align-self-end"><label class="likes-count">${post.likes}</label> <b>likes</b></span>
                                </div>
                            </div>                         
                        </div>`
    }
    else {
        div.innerHTML = `<div data-postid="${post.id}">
                            <a href="/profile/${post.user}">@<b>${post.user}</b></a><label class="timestamp">${post.timestamp}</label>
                            <pre>${post.body}</pre>
                            <div class="container-fluid">
                                <div class="row justify-content-between">
                                    <span class="col like-btn ${liked_by_user}"></span>
                                    <span class="col likes-count-span align-self-end"><label class="likes-count">${post.likes}</label> <b>likes</b></span>
                                </div>
                            </div>                         
                        </div>`
    }
    return div;
}

export async function toggle_like(post_id){
    const like_count = await fetch(`/post/${post_id}/like`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
            "X-CSRFToken": get_crsf_token(),
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
    })
    .then( response  => {
        if(response.status === 201) {
            return response.json();
        }
    })
    .catch( error => {
        console.log(error);
    })
    return like_count;
}
export function set_likes() {
    document.querySelectorAll('.like-btn').forEach(span => {
        span.addEventListener('click', () => {
            if(username === "")
                return;
            const post_id = span.parentNode.parentNode.parentNode.dataset.postid;
            if(span.classList.contains('liked'))
                toggle_like(post_id).then(result => {
                    span.className = 'col like-btn unliked';
                    span.parentNode.querySelector('.likes-count').innerHTML = result.likes;
                })
            else
                toggle_like(post_id).then(result => {
                    span.className = 'col like-btn liked';
                    span.parentNode.querySelector('.likes-count').innerHTML = result.likes;
                })
        })
    });
}

export function set_pagination(base_url, page_range, current_page){

    // Previous page btn
    const prev_li = document.createElement('li');
    prev_li.className = current_page === 1? "page-item disabled" : "page-item";
    prev_li.innerHTML = '<span id="prev-page-btn" class="page-link" aria-label="Previous" aria-hidden="true">&laquo;</span>';
    document.querySelector('.pagination').append(prev_li);
    page_range.forEach(page_num => {
        const li = document.createElement('li');
        li.className = "page-item";
        li.innerHTML = current_page === page_num? `<span class="page-link active">${page_num}</span>` : `<span class="page-link">${page_num}</span>`
        document.querySelector('.pagination').append(li);
    });
    const next_li = document.createElement('li');
    next_li.className = current_page === page_range[page_range.length-1] ? "page-item disabled" : "page-item";
    next_li.innerHTML = '<span id="next-page-btn" class="page-link" aria-label="Next" aria-hidden="true">&raquo;</span>'
    document.querySelector('.pagination').append(next_li);
    // Set click listeners and page changes.
     document.querySelectorAll('.page-item').forEach(btn => {
                  let redirect_page_num = current_page;
                  if (!btn.classList.contains("disabled")) {
                      btn.addEventListener('click', () => {
                          if (btn.firstChild.id === 'prev-page-btn'){
                              redirect_page_num -= 1;
                          }
                          else if (btn.firstChild.id === 'next-page-btn')
                              redirect_page_num += 1;
                          else {
                              redirect_page_num = parseInt(btn.firstChild.innerHTML);
                          }
                          location.href = `/${base_url}?page=${redirect_page_num}`;
                      })

                  }
     });
}

export function set_edits() {
    document.querySelectorAll('.edit-btn').forEach(span => {
        span.addEventListener('click', () => {
             // Remove all edition buttons until saved.
             document.querySelectorAll('.edit-btn').forEach(span => {
                 span.style.display = "none";
             });
            const post_div = span.parentNode;
            const post_text = post_div.querySelector("pre").textContent;
            const edit_div = document.createElement('div');
            edit_div.id = "edit_view";
            edit_div.innerHTML =`<form id="edit-form" class="form-inline"><textarea id="edit-body" rows="3", maxlength="200" name="edit-body" class="form-control">${post_text}</textarea> 
                                <button id="edit-submit" type="submit" class="btn btn-light">&#128190;</button></form>`;
            post_div.replaceChild(edit_div, post_div.childNodes[6]);
            edit_div.firstChild.onsubmit = () => {
                const post_id = post_div.dataset.postid;
                const new_body = edit_div.querySelector("#edit-body").value;
                edit_post(post_id, new_body)
                    .then(result => {
                       // Enable all edit buttons again.
                        if("post" in result){
                            document.querySelectorAll('.edit-btn').forEach(span => {
                                span.style.display = "inline-block";
                            });
                            post_div.replaceChild(render_html(result.post).querySelector("pre"),edit_div);
                        }
                        else{
                            show_message('danger', result.error);
                        }
                    });
                return false;
            };
        })
    });
}


export async function edit_post(post_id, new_body){
    const post = await fetch(`/post/${post_id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        body: JSON.stringify({
            "new_body": new_body
        }),
        headers: {
            "X-CSRFToken": get_crsf_token(),
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
    })
    .then( response  => {
        return response.json();
    })
    .catch( error => {
        console.log(error);
    })
    return post;
}

export function show_message(type, message){
    if(!type in ['danger','info', 'warning','success'])
        type = 'info';
    const message_div = document.createElement('div');
    message_div.className = `alert alert-${type}`;
    message_div.innerHTML = message;
    document.querySelector('#message-div').innerHTML = "";
    document.querySelector('#message-div').append(message_div);
    setTimeout(() => {
        if(document.querySelector('#message-div').contains(message_div))
            document.querySelector('#message-div').removeChild(message_div);
    }, 3000);
}