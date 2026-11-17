const feedbackForm = document.querySelector("#feedback-form");
const commentForm = document.querySelector("#comment-form");
const commentList = document.querySelector("#comment-list");

function readStoredItems(key) {
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  const items = JSON.parse(stored);
  if (!Array.isArray(items)) throw new Error("Stored content is not a list.");
  return items;
}

function renderComments() {
  if (!commentList) return;

  commentList.replaceChildren();
  for (const comment of readStoredItems("peace-over-fear-comments")) {
    if (!comment || typeof comment.message !== "string") continue;

    const item = document.createElement("li");
    const author = document.createElement("span");
    const message = document.createElement("p");
    author.className = "comment-author";
    author.textContent = comment.name || "A visitor";
    message.className = "comment-text";
    message.textContent = comment.message;
    item.append(author, message);
    commentList.append(item);
  }
}

if (feedbackForm) {
  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.querySelector("#feedback-status");
    const message = new FormData(feedbackForm).get("message").trim();

    try {
      const feedback = readStoredItems("peace-over-fear-feedback");
      feedback.push({ message, createdAt: new Date().toISOString() });
      localStorage.setItem("peace-over-fear-feedback", JSON.stringify(feedback));
      feedbackForm.reset();
      status.textContent = "Your feedback was saved in this browser.";
    } catch (error) {
      status.textContent = "Feedback could not be saved in this browser. Please try again.";
      console.error("Could not save feedback locally.", error);
    }
  });
}

if (commentForm) {
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("#comment-status");
    const formData = new FormData(commentForm);
    const comment = {
      name: formData.get("name").trim(),
      message: formData.get("message").trim(),
      createdAt: new Date().toISOString()
    };

    status.textContent = "Sending your comment…";
    try {
      const response = await fetch("https://formsubmit.co/ajax/bonelibonheur@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: comment.name || "A visitor",
          message: comment.message,
          _subject: "New Peace Over Fear website comment",
          _honey: formData.get("_honey")
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "The email service did not accept the comment.");
      }
    } catch (error) {
      status.textContent = "Your comment could not be sent. Please try again later.";
      console.error("Could not email the comment.", error);
      return;
    }

    commentForm.reset();
    status.textContent = "Your comment was emailed.";
    try {
      const comments = readStoredItems("peace-over-fear-comments");
      comments.push(comment);
      localStorage.setItem("peace-over-fear-comments", JSON.stringify(comments));
      renderComments();
      status.textContent = "Your comment was emailed and saved in this browser.";
    } catch (error) {
      status.textContent = "Your comment was emailed, but could not be saved in this browser.";
      console.error("Could not save the emailed comment locally.", error);
    }
  });

  try {
    renderComments();
  } catch (error) {
    document.querySelector("#comment-status").textContent = "Saved comments could not be loaded.";
    console.error("Could not load comments from local storage.", error);
  }
}
