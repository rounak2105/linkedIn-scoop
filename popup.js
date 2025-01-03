document.addEventListener('DOMContentLoaded', () => {
  const scrapeButton = document.getElementById("scrape");
  const spinner = document.getElementById("spinner");
  const emailList = document.getElementById("emails");

  scrapeButton.addEventListener("click", async () => {
    // Show spinner and disable button
    spinner.style.display = "block";
    scrapeButton.disabled = true;
    emailList.innerHTML = ''; // Clear previous results

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: scrapeEmails,
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              emailList.innerHTML = '<li style="color: red;">Error: Could not scrape page</li>';
              return;
            }

            const emails = results[0].result || [];
            const uniqueEmails = new Set(emails);

            if (uniqueEmails.size === 0) {
              emailList.innerHTML = '<li>No emails found</li>';
            } else {
              emailList.innerHTML = [...uniqueEmails]
                .map(email => `<li>${email}</li>`)
                .join("");
            }

            // Hide spinner and enable button
            spinner.style.display = "none";
            scrapeButton.disabled = false;
          }
        );
      });
    } catch (error) {
      console.error('Error:', error);
      emailList.innerHTML = '<li style="color: red;">An error occurred</li>';
      spinner.style.display = "none";
      scrapeButton.disabled = false;
    }
  });
});

async function scrapeEmails() {
  try {
    let prevHeight = 0;

    // Scroll until no more content loads
    while (true) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newHeight = document.body.scrollHeight;
      if (newHeight === prevHeight) {
        console.log("No more content to load.");
        break;
      }
      prevHeight = newHeight;
    }

    const commentButtons = document.querySelectorAll('button[aria-label="Comment"]');
    for (const button of commentButtons) {
      try {
        button.click();
      } catch (error) {
        console.error('Error clicking button:', error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const posts = document.querySelectorAll("div, span");
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emails = new Set();

    posts.forEach(post => {
      const matches = post.innerText.match(emailRegex);
      if (matches) {
        matches.forEach(email => emails.add(email));
      }
    });

    return [...emails];
  } catch (error) {
    console.error('Scraping error:', error);
    return [];
  }
}