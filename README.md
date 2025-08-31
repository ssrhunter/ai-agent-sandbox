# To start the project,

1. Check the code out to a directory on your local machine.
2. Create a .env file that contains:
   - MONGODB_ATLAS_URI=
   - OPENAI_API_KEY=
   - ANTHROPIC_API_KEY=
3. Install Mongodb Atlas and create a local cluster.
4. Instally Ollama and LM Studio if you want to run the LLMs locally.

Test:
curl -X POST -H "Content-Type: application/json" -d '{"message": "Build a team to make an iOS app, and tell me the talent gaps."}' http://localhost:3000/chat

NOTE: the parser seems to run into trouble if more than 10 records are generated in seed-database.ts.
