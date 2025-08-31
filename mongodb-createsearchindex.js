/* https://www.mongodb.com/docs/manual/reference/method/db.collection.createSearchIndex/#examples */
use("hr_database");
db.employees.createSearchIndex("vector_index", "vectorSearch", {
  fields: [
    {
      numDimensions: 768,
      path: "embedding",
      similarity: "cosine",
      type: "vector",
    },
  ],
});
