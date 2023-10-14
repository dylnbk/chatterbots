const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
window.messages = [{ role: "system", content: "You are friendly and relaxed assistant that works for the website BotBuddy. Your purpose is to ask lots of questions about the user and provide specialized information about their request. BotBuddy is a company offering custom chatbots, for personal or business use. The services they offer are: 'Personal' - Personalized chatbots tailored to match your personality, expressions and tone. Integration on platforms such as Discord, Telegram, Facebook and standalone websites. Direct communication with your audience, making interactions vibrant and meaningful. Capable of understanding and responding to FAQs about your work, upcoming plans, or portfolio. Complete setup provided, no need for any technical knowledge. 'Business' - Custom chatbots for small businesses to meet operational needs or customer service goals. Integration into your business website, standalone applications, and social platforms for extended reach. Advanced chatbots that can serve as a knowledge base for employee training or customer inquiries, providing customers with accurate and quick responses. Automation of tasks, freeing up your team to focus on more complex work. Multi-language support to serve your customers globally with clarity and precision. You can occasionally use emojis in your responses and will talk about every topic when asked. If the user asks about contact information or how to contact, they can use the contact form (can be accessed via the navbar link at the top of the page) which will send a message to the team. The contact form will request their email address and their message. The customer MUST contact us via the form if they want to use BotBuddy services. We aim to respond within 24 hours."}];
const inputInitHeight = chatInput.scrollHeight;


// Helper function to escape HTML by replacing special characters with their HTML entities.
function escapeHTML(str) {
    const specialChars = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#039;',
    };
    return str.replace(/[&<>"']/g, m => specialChars[m]);
}

const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<p class="incoming-text"></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; // Return chat <li> element
}

const generateResponse = (chatElement) => {
    return new Promise((resolve) => {
        const API_URL = "https://api.openai.com/v1/chat/completions";
        const messageElement = chatElement.querySelector("p");

        // Add user's current message to messages array
        window.messages.push({ role: "user", content: userMessage });


        fetch('/.netlify/functions/manageAPIKey')
            .then(response => response.json())
            .then(data => {
                // Here's the API key
                const API_KEY = data.key;

                // Define the properties and message for the API request
                const requestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4",
                        messages: window.messages,
                        frequency_penalty: 0.5,
                    })
                };

                // Send POST request to API, get response and set the reponse as paragraph text
                fetch(API_URL, requestOptions)
                    .then(res => res.json())
                    .then(data => {
                        // Check for the tokens usage and remove 1 index if gate condition satisfies.
                        if (data['usage']['total_tokens'] > 7000) {
                            window.messages.splice(1, 1);
                        }

                        let rawAssistantMessage = data.choices[0].message.content.trim();
                        let parts = rawAssistantMessage.split("```");

                        let assistantMessage = "";
                        for (let i = 0; i < parts.length; i++) {
                            if (i % 2 === 0) {
                                // This is a normal text part
                                assistantMessage += escapeHTML(parts[i]);
                            } else {
                                // This is a code part
                                assistantMessage += `<pre><code>${escapeHTML(parts[i])}</code></pre>`;
                            }
                        }

                        // Check if the message contains a URL and wrap it in <a> tag if it does
                        let urlRegex = /(https?:\/\/[^\s]+)/g;
                        assistantMessage = assistantMessage.replace(urlRegex, function (url) {
                            // Remove trailing period
                            url = url.replace(/\.$/, '');

                            // Wrap URL in <a> tag
                            return '<a href="' + url + '">' + url + '</a>';
                        });

                        messageElement.innerHTML = assistantMessage;

                        // Add assistant's response to messages array
                        window.messages.push({ role: "assistant", content: rawAssistantMessage });
                        resolve();

                    }).catch(() => {
                        messageElement.classList.add("error");
                        messageElement.textContent = "Oops! Something went wrong. Please try again.";
                        resolve();
                    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
            });
        });
}

const handleChat = () => {
    userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
    if (!userMessage) return;

    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Append the user's message to the chatbox
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    // Define the states of thinking dots animation
    const elipsis_frames = ["   ", ".  ", ".. ", "..."];
    let current_frame = 0;

    setTimeout(() => {
        const incomingChatLi = createChatLi(elipsis_frames[0], "incoming");
    
        const incomingP = incomingChatLi.querySelector('.incoming-text');
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
    
        let elipsis_interval = setInterval(() => {
            current_frame = (current_frame + 1) % elipsis_frames.length; // Cycle through frames
            incomingP.textContent = elipsis_frames[current_frame]; // Update p content
        }, 250); // Change the dots every half second
    
        generateResponse(incomingChatLi).then(() => {
            clearInterval(elipsis_interval); // Cancel the interval
        });
    }, 600);
}

chatInput.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed without Shift key and the window 
    // width is greater than 800px, handle the chat
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);