from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot_model import generate_reply
from db import conversations # Import the conversations collection

app = Flask(__name__)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat():
    user_msg = request.json.get("message")
    # history parameter here is passed from frontend for AI context, not for database saving.
    # The database saving happens below.
    history_for_model = request.json.get("history", []) # This can be used to pass previous context to generate_reply

    if not user_msg:
        return jsonify({"reply": "No message received."}), 400

    try:
        # Use history_for_model if your generate_reply truly needs it for context
        reply = generate_reply(user_msg, history_for_model)

        # Save both user and bot messages to MongoDB
        # It's better to save them as a pair or in order to maintain conversation flow
        conversations.insert_one({"user": user_msg, "bot": reply, "timestamp": datetime.utcnow()}) # Add timestamp for sorting
        return jsonify({"reply": reply})
    except Exception as e:
        print("❌ BACKEND ERROR:", str(e))
        return jsonify({"reply": "Something went wrong!"}), 500

# --- NEW ENDPOINT TO FETCH CONVERSATIONS ---
@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    try:
        # Fetch all conversations, sort by timestamp, and exclude the MongoDB _id
        all_convs = list(conversations.find({}, {'_id': 0}).sort('timestamp', 1))
        return jsonify(all_convs)
    except Exception as e:
        print("❌ BACKEND ERROR (get_conversations):", str(e))
        return jsonify({"error": "Failed to retrieve conversations"}), 500

if __name__ == '__main__':
    from datetime import datetime # Import datetime for timestamps
    app.run(debug=True)