import * as api from "./api_calls.js";
const username = JSON.parse(document.getElementById('username').textContent);

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#newpost-form').onsubmit = () => {
        const new_post = api.create_post(document.querySelector('#newpost-body').value)
            .then(result => {
                if("post" in result){
                    // OK
                    location.href = "/allposts?page=1";
                }
                else{
                    api.show_message('danger', result.error);
                }
            });
        document.querySelector('#newpost-body').innerHTML = '';
        return false;
    };
    if(username === ""){
        posts_view('allposts_unlogged');
    }
    else {
        const following_view = JSON.parse(document.getElementById('following').textContent);
        if (following_view) {
            posts_view('following');
        }
        else {
            posts_view('allposts');
        }
    }
});

function posts_view(view) {
    const params = new URLSearchParams(window.location.search);
    let current_page = parseInt(params.get("page")) || 1;
  // Reset the list
  document.querySelector('#posts-list').innerHTML = '';
  if(view === "allposts_unlogged") {
      document.querySelector('#newpost-view').style.display = 'none';
      document.querySelector('#allposts-btn').className ="nav-link active";
      document.querySelector('#posts-title').innerHTML = 'All Posts';
      // Get corresponding page of ALL posts
      api.get_all_posts(current_page)
          .then(result => {
              document.querySelector("#posts-list").innerHTML = '';
              result.posts.forEach(p => {
                  document.querySelector("#posts-list").append(api.render_html(p));
              })
              if( current_page > result.page_range[result.page_range.length-1]){
                  current_page = result.page_range[result.page_range.length-1];
                  params.set("page",current_page);
                  history.replaceState(null, null, "?"+params.toString());
              }
              api.set_pagination('allposts',result.page_range, current_page);
      });
  }
  if(view === "allposts") {
      document.querySelector('#newpost-view').style.display = 'block';
      document.querySelector('#allposts-btn').className ="nav-link active";
      document.querySelector('#following-btn').className ="nav-link";
      document.querySelector('#posts-title').innerHTML = 'All Posts';
      // Get corresponding page of ALL posts
      api.get_all_posts(current_page)
          .then(result => {
              document.querySelector("#posts-list").innerHTML = '';
              result.posts.forEach(p => {
                  document.querySelector("#posts-list").append(api.render_html(p));
              })
              api.set_likes();
              api.set_edits();
              if( current_page > result.page_range[result.page_range.length-1]){
                  current_page = result.page_range[result.page_range.length-1];
                  params.set("page",current_page);
                  history.replaceState(null, null, "?"+params.toString());
              }

              api.set_pagination('allposts',result.page_range, current_page);
      });
  }
  if(view === 'following') {
      document.querySelector('#allposts-btn').className ="nav-link";
      document.querySelector('#following-btn').className ="nav-link active";
      document.querySelector('#posts-title').innerHTML = "Following";
      document.querySelector('#newpost-view').style.display = 'none';
      // Get ALL posts
      api.get_following_posts()
          .then(result => {
              result.posts.forEach(p => {
                  document.querySelector("#posts-list").append(api.render_html(p));
          })
          api.set_likes();
          if( current_page > result.page_range[result.page_range.length-1]){
              current_page = result.page_range[result.page_range.length-1];
              params.set("page",current_page);
              history.replaceState(null, null, "?"+params.toString());
          }
          api.set_pagination('following', result.page_range, current_page);
      });
  }

}

