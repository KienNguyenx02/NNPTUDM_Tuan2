async function GetData() {
    try {
        let res = await fetch('http://localhost:3000/posts')
        if (res.ok) {
            let posts = await res.json();
            let bodyTable = document.getElementById('body-table');
            bodyTable.innerHTML = '';
            for (const post of posts) {
                bodyTable.innerHTML += convertObjToHTML(post)
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;

    if (id) { // If id exists, it's an update
        let getItem = await fetch('http://localhost:3000/posts/' + id);
        if (getItem.ok) {
            let post = await getItem.json();
            let res = await fetch('http://localhost:3000/posts/'+id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...post, // keep existing data
                    title: title,
                    views: views
                })
            })
        }
    } else { // If id doesn't exist, it's a create
        // Get all posts to find the max id
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let maxId = 0;
        if (posts.length > 0) {
            maxId = Math.max(...posts.map(p => parseInt(p.id)));
        }
        let newId = (maxId + 1).toString();

        //fetch -> HTTP POST
        let postRes = await fetch('http://localhost:3000/posts', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                title: title,
                views: views,
                isDeleted: false
            })
        })
    }
    GetData();
    document.getElementById("id_txt").value = '';
    document.getElementById("title_txt").value = '';
    document.getElementById("views_txt").value = '';
    return false;

}

function convertObjToHTML(post) {
    const rowStyle = post.isDeleted ? 'style="text-decoration: line-through;"' : '';
    return `<tr ${rowStyle}>
    <td>${post.id}</td>
    <td>${post.title}</td>
    <td>${post.views}</td>
    <td>
        <input type='submit' value='Delete' onclick='Delete("${post.id}")'>
        <input type='submit' value='Show Comments' onclick='ShowComments("${post.id}")'>
    </td>
    </tr>`
}
async function Delete(id) {
    let postRes = await fetch('http://localhost:3000/posts/' + id);
    if (!postRes.ok) {
        console.error("Post not found");
        return;
    }
    let post = await postRes.json();
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({...post, isDeleted: true})
    })
    if (res.ok) {
        GetData()
    }
    return false;
}
GetData();

async function ShowComments(postId) {
    document.getElementById('comments-section').style.display = 'block';
    document.getElementById('comments-post-id').innerText = postId;
    document.getElementById('comment_post_id').value = postId;

    let res = await fetch(`http://localhost:3000/comments?postId=${postId}`);
    if (res.ok) {
        let comments = await res.json();
        let commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '';
        for (const comment of comments) {
            commentsList.innerHTML += `
                <div>
                    <p>${comment.text}</p>
                    <input type="submit" value="Edit" onclick="EditComment('${comment.id}', '${comment.text}', '${comment.postId}')">
                    <input type="submit" value="Delete" onclick="DeleteComment('${comment.id}', '${comment.postId}')">
                </div>
                <hr>
            `;
        }
    }
}

function EditComment(commentId, text, postId) {
    document.getElementById('comment_id').value = commentId;
    document.getElementById('comment_post_id').value = postId;
    document.getElementById('comment_text').value = text;
}

async function SaveComment() {
    let commentId = document.getElementById('comment_id').value;
    let postId = document.getElementById('comment_post_id').value;
    let text = document.getElementById('comment_text').value;

    if (commentId) { // Update
        let res = await fetch(`http://localhost:3000/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, postId: postId })
        });
    } else { // Create
        let res = await fetch(`http://localhost:3000/comments`);
        let comments = await res.json();
        let maxId = 0;
        if (comments.length > 0) {
            maxId = Math.max(...comments.map(c => parseInt(c.id)));
        }
        let newId = (maxId + 1).toString();

        await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: newId, text: text, postId: postId })
        });
    }

    // Clear form and reload comments
    document.getElementById('comment_id').value = '';
    document.getElementById('comment_text').value = '';
    ShowComments(postId);
    return false;
}

async function DeleteComment(commentId, postId) {
    let res = await fetch(`http://localhost:3000/comments/${commentId}`, {
        method: 'DELETE'
    });
    if (res.ok) {
        ShowComments(postId);
    }
    return false;
}
