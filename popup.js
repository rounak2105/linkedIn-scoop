document.getElementById("scrape").addEventListener("click", async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: scrapeEmails,
        },
        (results) => {
          const emails = results[0].result || [];
          const emailList = document.getElementById("emails");
          // Ensure emails is a Set to store unique values
          const uniqueEmails = new Set(emails);
          emailList.innerHTML = [...uniqueEmails].map(email => `<li>${email}</li>`).join("")        }
      );
    });
  });

  async function scrapeEmails() {
      // Click all "Comment" buttons
    let prevHeight = 0;

    // Scroll until no more content loads
    while (true) {
    window.scrollTo(0, document.body.scrollHeight); // Scroll to the bottom
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds to load new content

    const newHeight = document.body.scrollHeight;
    if (newHeight === prevHeight) {
        console.log("No more content to load.");
        break; // Stop scrolling when no new content is loaded
    }
    prevHeight = newHeight; // Update the previous height for comparison
    }
    const commentButtons = document.querySelectorAll('button[aria-label="Comment"]'); // Using aria-label for better selector accuracy
    commentButtons.forEach(button => button.click());
    await new Promise(resolve => setTimeout(resolve, 2000));
    const posts = document.querySelectorAll("div, span"); // Adjust to LinkedIn's DOM structure
    console.log(posts)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emails = [];
  
    posts.forEach(post => {
      const matches = post.innerText.match(emailRegex);
      if (matches) {
        emails.push(...matches);
      }
    });
  
    return emails;
  }
  