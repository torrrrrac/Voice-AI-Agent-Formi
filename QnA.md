# Submission Responses

## What was your initial thought process when you first read the problem statement, and how did you break it down into smaller, manageable parts?

When I first read the problem statement, I recognized that we were dealing with a limitation (800 token responses) that needed to be worked around for a voice AI system. My initial thought process was to understand the core issue: large chunks of information were being truncated, making responses inaccurate.

I broke the problem down into these manageable parts:
1. Data Access Layer - First, I needed to organize all the CSV data files and create APIs to access them
2. Information Chunking System - Design a way to break large responses into digestible chunks under 800 tokens
3. Context Management - Ensure the system maintains context across multiple API calls
4. Conversation Logging - Track call details and log them to Google Sheets

This modular approach helped me tackle one component at a time, starting with the core challenge of token-limited information delivery.

## What specific tools, libraries, or online resources did you use to develop your solution, and why did you choose them over other options?

For my solution, I chose:
- Node.js with Express: I selected this because of its lightweight nature and ability to quickly create RESTful APIs
- fs-extra: For enhanced file system operations beyond Node's built-in fs module
- csv-parser: For efficient CSV parsing with streaming capabilities
- Google Sheets API: For the conversation logging requirement, as it offered a familiar interface and easy integration

I considered alternatives like using a database (MongoDB or SQLite) instead of directly reading CSV files, but decided against it to keep the solution lightweight and avoid an additional layer of data transformation. For the token estimation, I implemented a custom algorithm rather than using an external library to maintain precise control over how chunks were created.

## Describe a key challenge you faced while solving this problem and how you arrived at the final solution?

A significant challenge I faced was with the schema endpoint for CSV files. Initially, I implemented it using Node's streaming capabilities via csv-parser, but this approach frequently timed out or returned incomplete results, especially for larger files. The issue was that the stream's 'end' event wasn't consistently firing, causing API requests to hang indefinitely.

After multiple debugging attempts, I changed my approach completely - switching from streaming to direct file reading (fs.readFile) and manual header parsing. This was more memory-intensive but significantly more reliable. I implemented error handling to catch file access issues and added logging to trace execution paths. This solution was much more robust and consistently returned the expected schema information without timeouts.

# If you had more time, what improvements or alternative approaches would you explore, and why do you think they might be valuable?

With more time, I would focus on these straightforward improvements:

1. **Adding basic caching** - Storing frequently accessed data in memory would reduce file system operations and improve response times, helping meet the 800ms requirement.

2. **Implementing better error handling** - Creating more specific error responses with clearer messages would help troubleshoot issues faster during development and in production.

3. **Adding automated testing** - Creating a comprehensive test suite would ensure all endpoints work correctly and prevent regressions when making changes.

4. **Improving CSV parsing** - Using a more robust CSV parsing approach would better handle edge cases like special characters and inconsistent formatting in the data files.

5. **Adding request validation middleware** - This would verify all incoming requests have the required fields before processing, making the API more stable and secure.

These simple improvements would make the system more reliable and maintainable without adding unnecessary complexity.