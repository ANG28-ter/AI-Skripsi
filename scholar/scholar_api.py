# file: scholar_api.py
from flask import Flask, request, jsonify
from scholarly import scholarly
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/sitasi", methods=["POST"])
def get_sitasi():
    data = request.json
    query = data.get("query", "")
    results = []

    if not query:
        return jsonify({"error": "Kueri kosong"}), 400

    try:
        search_results = scholarly.search_pubs(query)
        for i in range(5):  # ambil 5 sitasi
            paper = next(search_results)
            apa = scholarly.bibtex(paper)
            results.append(paper['bib']['title'] + " – " + paper['bib'].get('author', ''))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"results": results})
