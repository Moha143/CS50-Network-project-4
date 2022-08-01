import * as api from './api_calls.js'

const profile_username = JSON.parse(document.getElementById('profile_username').textContent);
const username = JSON.parse(document.getElementById('username').textContent);

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    let current_page = parseInt(params.get("page")) || 1;
    // Get user's posts
    api.get_user_posts(profile_username, current_page)
        .then(result => {
            result.posts.forEach(p => {
                document.querySelector("#posts-list").append(api.render_html(p));
            })
            api.set_likes();
            if(profile_username === username){
                api.set_edits();
            }
           if( current_page > result.page_range[result.page_range.length-1]){
                  current_page = result.page_range[result.page_range.length-1];
                  params.set("page",current_page);
                  history.replaceState(null, null, "?"+params.toString());
              }
            api.set_pagination(`profile/${profile_username}`, result.page_range, current_page);
        });
    if(profile_username !== username){
        document.querySelector('#follow-btn').addEventListener('click', () => {
            api.toggle_following(profile_username)
                .then(result => {
                    api.show_message('success', result.message);
                    const follow_btn = document.querySelector('#follow-btn');
                    follow_btn.innerHTML = follow_btn.innerHTML === 'Follow' ? 'Unfollow' : 'Follow';
                    document.querySelector('#followers-count').innerHTML = result["followers"];
                    document.querySelector('#following-count').innerHTML = result["following"];
                });
        });
    }

});