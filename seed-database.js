"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
const output_parsers_1 = require("@langchain/core/output_parsers");
const mongodb_1 = require("mongodb");
const mongodb_2 = require("@langchain/mongodb");
const zod_1 = require("zod");
require("dotenv/config");
const mongoClient = new mongodb_1.MongoClient(process.env.MONGODB_ATLAS_URI);
const llm = new openai_1.ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
});
const EmployeeSchema = zod_1.z.object({
    employee_id: zod_1.z.string(),
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string(),
    date_of_birth: zod_1.z.string(),
    address: zod_1.z.object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        postal_code: zod_1.z.string(),
        country: zod_1.z.string(),
    }),
    contact_details: zod_1.z.object({
        email: zod_1.z.string().email(),
        phone_number: zod_1.z.string(),
    }),
    job_details: zod_1.z.object({
        job_title: zod_1.z.string(),
        department: zod_1.z.string(),
        hire_date: zod_1.z.string(),
        employment_type: zod_1.z.string(),
        salary: zod_1.z.number(),
        currency: zod_1.z.string(),
    }),
    work_location: zod_1.z.object({
        nearest_office: zod_1.z.string(),
        is_remote: zod_1.z.boolean(),
    }),
    reporting_manager: zod_1.z.string().nullable(),
    skills: zod_1.z.array(zod_1.z.string()),
    performance_reviews: zod_1.z.array(zod_1.z.object({
        review_date: zod_1.z.string(),
        rating: zod_1.z.number(),
        comments: zod_1.z.string(),
    })),
    benefits: zod_1.z.object({
        health_insurance: zod_1.z.string(),
        retirement_plan: zod_1.z.string(),
        paid_time_off: zod_1.z.number(),
    }),
    emergency_contact: zod_1.z.object({
        name: zod_1.z.string(),
        relationship: zod_1.z.string(),
        phone_number: zod_1.z.string(),
    }),
    notes: zod_1.z.string(),
});
const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.array(EmployeeSchema));
async function generateSyntheticData() {
    const prompt = `You are a helpful assistant that generates employee data. Generate 10 fictional employee records. Each record should include the following fields: employee_id, first_name, last_name, date_of_birth, address, contact_details, job_details, work_location, reporting_manager, skills, performance_reviews, benefits, emergency_contact, notes. Ensure variety in the data and realistic values.
  
    ${parser.getFormatInstructions()}`;
    console.log("Generating synthetic data...");
    const response = await llm.invoke(prompt);
    return parser.parse(response.content);
}
async function createEmployeeSummary(employee) {
    return new Promise((resolve) => {
        const jobDetails = `${employee.job_details.job_title} in ${employee.job_details.department}`;
        const skills = employee.skills.join(", ");
        const performanceReviews = employee.performance_reviews
            .map((review) => `Rated ${review.rating} on ${review.review_date}: ${review.comments}`)
            .join(" ");
        const basicInfo = `${employee.first_name} ${employee.last_name}, born on ${employee.date_of_birth}`;
        const workLocation = `Works at ${employee.work_location.nearest_office}, Remote: ${employee.work_location.is_remote}`;
        const notes = employee.notes;
        const summary = `${basicInfo}. Job: ${jobDetails}. Skills: ${skills}. Reviews: ${performanceReviews}. Location: ${workLocation}. Notes: ${notes}`;
        resolve(summary);
    });
}
async function seedDatabase() {
    console.log("Running seedDatabase()...");
    try {
        await mongoClient.connect();
        await mongoClient.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = mongoClient.db("hr_database");
        const collection = db.collection("employees");
        await collection.deleteMany({});
        const syntheticData = await generateSyntheticData();
        const recordsWithSummaries = await Promise.all(syntheticData.map(async (record) => ({
            pageContent: await createEmployeeSummary(record),
            metadata: { ...record },
        })));
        for (const record of recordsWithSummaries) {
            await mongodb_2.MongoDBAtlasVectorSearch.fromDocuments([record], new openai_1.OpenAIEmbeddings(), {
                collection,
                indexName: "vector_index",
                textKey: "embedding_text",
                embeddingKey: "embedding",
            });
            console.log("Successfully processed & saved record:", record.metadata.employee_id);
        }
        console.log("Database seeding completed");
    }
    catch (error) {
        console.error("Error seeding database:", error);
    }
    finally {
        await mongoClient.close();
    }
}
console.log("Running seed-database.ts...");
seedDatabase().catch(console.error);
//# sourceMappingURL=seed-database.js.map