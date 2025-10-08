# Managed DB setup (MongoDB, Neo4j, Vector DB)

This document explains how to replace local containers with managed services in AWS or equivalent cloud offerings, and how to wire them into UNIUN.

## 1) MongoDB (NoSQL for metadata)

Recommended: MongoDB Atlas (AWS region aligned). Alternative: Amazon DocumentDB (Mongo API) if compatibility is sufficient for your workload.

Steps (Atlas):

- Create an Atlas project and M10+ cluster in your region.
- Create a DB user (readWrite) and IP access rules/VPC peering as needed.
- Collect your connection string (SRV) and set `MONGO_URI` (e.g., `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/uniun?retryWrites=true&w=majority`).

## 2) Neo4j (Graph for users, follows, interactions)

Recommended: Neo4j AuraDB (Professional or Enterprise, hosted). Alternative: Neo4j self-managed on EC2.

Steps (AuraDB):

- Create a new AuraDB instance in your region.
- Download credentials; set `NEO4J_URI` (bolt+s://...), `NEO4J_USER`, `NEO4J_PASSWORD`.

Graph models you can support:

- Nodes: User, Post, Message, Hashtag
- Rels: FOLLOWS, LIKED, POSTED, MENTIONED, REPLIED_TO, IN_THREAD, SENT_TO

## 3) Vector DB (embeddings & similarity)

Options:

- Qdrant Cloud (managed), set `VECTORDB_KIND=qdrant`, `QDRANT_URL=https://...`.
- Pinecone (managed), set `VECTORDB_KIND=pinecone`, `PINECONE_API_KEY=...`, `PINECONE_INDEX=...`.
- Milvus (self-managed on EC2/EKS), set `VECTORDB_KIND=milvus`, `MILVUS_URI=grpc://host:19530`.

Schema guidance:

- Collection: `posts_embeddings` (id, postId, userId, vector, metadata)
- Metrics: cosine similarity / IP

## 4) Backend configuration

Set environment variables in ECS task definition or compose.prod:

```bash
MONGO_URI=...
NEO4J_URI=...
NEO4J_USER=...
NEO4J_PASSWORD=...
VECTORDB_KIND=qdrant|pinecone|milvus
QDRANT_URL=...
PINECONE_API_KEY=...
PINECONE_INDEX=...
MILVUS_URI=...
```

No code changes are required for basic startup if Mongo/Neo4j URIs are set; add vector DB integration where needed in your service layer (embeddings, search).

## 5) ECS tips

- Use Secrets Manager or SSM Parameter Store for credentials; map into ECS task env.
- Ensure security groups allow outbound to DB endpoints and inbound rules on DBs permit traffic from service subnets.
- Prefer VPC peering/private links for Atlas/Aura to avoid public endpoints in production.
