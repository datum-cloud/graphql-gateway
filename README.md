## GraphQL Gateway for Milo APIServer

This project provides a **GraphQL gateway** that sits in front of Milo APIServer REST/OpenAPI services and exposes a unified GraphQL API. It uses **Hive Mesh** at build time to compose a supergraph from OpenAPI specs, and **Hive Gateway** to serve the federated GraphQL endpoint.

> **Status**: This gateway is in an **initial, non‑production stage**. It is intended **only for local testing by the Datum team** and **is not production ready**.

### What Hive Mesh is

- **Hive Mesh**: a composition/mesh tool that can read multiple upstream sources (OpenAPI, REST, GraphQL, etc.) and generate a single federated GraphQL schema (a **supergraph**).
- In this project, Hive Mesh:
  - Reads Milo OpenAPI definitions listed in `config/apis.yaml`.
  - Uses `mesh.config.ts` to map those APIs into subgraphs.
  - Outputs `supergraph.graphql`, which Hive Gateway then runs.

### What Hive Gateway is

- **Hive Gateway**: a production-ready GraphQL gateway/router from the GraphQL Hive ecosystem.
- It:
  - Loads the `supergraph.graphql` produced by Hive Mesh.
  - Executes incoming GraphQL operations by delegating to the underlying Milo APIs.
  - Handles concerns like header propagation, TLS, caching, and observability.

### Why `--hive-router-runtime`

- **`--hive-router-runtime`** tells Hive Gateway to use the **Hive Router runtime** as its execution engine.
- In practice this:
  - Enables the newer router-style unified graph execution path.
  - Improves compatibility with Mesh-based supergraphs and transport plugins (such as HTTP/REST).
  - Keeps the gateway aligned with the same runtime used by the standalone Hive Router.
  - Increases execution speed

### Project scripts

Defined in `package.json`:

- **`npm run supergraph:compose`**
  - Uses Hive Mesh (`mesh-compose`) and `mesh.config.ts` to generate `supergraph.graphql` locally.
  - Reads API groups/versions from `config/apis.yaml` and environment such as `DATUM_TOKEN` and `DATUM_BASE_URL`.

- **`npm run dev`**
  - Runs Hive Gateway directly against `supergraph.graphql` in the local working directory.
  - Useful for quick local development when you already composed the supergraph.

- **`npm run start:gateway`**
  - Builds a Docker image (`graphql-gateway`) using the provided `Dockerfile`:
    - Passes `DATUM_TOKEN` and `DATUM_BASE_URL` as build arguments for Mesh composition.
    - Runs `mesh-compose` in the build stage to bake `supergraph.graphql` into the image.
  - Starts the container on port `4000` and removes the image when the container exits.
  - Intended as a simple “build-and-run” entrypoint for local or ad‑hoc environments.

### Querying Milo through the gateway

- **Using Postman with `supergraph.graphql`**:
  - After running `npm run supergraph:compose`, you will have a local `supergraph.graphql` file.
  - In Postman, create a new GraphQL request and **import** or **paste** the contents of `supergraph.graphql` as the schema.
  - Point the request URL to your running gateway (for example `http://127.0.0.1:4000/graphql`) and you can start querying Milo through the GraphQL gateway.

- **Using the built‑in GraphQL UI**:
  - When you run the gateway locally (via `npm run dev` or `npm run start:gateway`), it exposes a GraphQL endpoint at `http://127.0.0.1:4000/graphql`.
  - Open `http://127.0.0.1:4000/graphql` in your browser to use the UI for exploring the schema and running queries against Milo.

### Basic usage

#### Datum access token (`DATUM_TOKEN`)

`DATUM_TOKEN` is a **Datum access token**. The easiest way to obtain it is with the `datumctl` CLI (see the official [datumctl docs](https://www.datum.net/docs/quickstart/datumctl/)).

- **Get a production token**:

  ```bash
  datumctl auth get-token
  ```

- **Get a staging token**:

  ```bash
  datumctl auth login --hostname auth.staging.env.datum.net
  datumctl auth get-token
  ```

Use the resulting token value as the `TOKEN` environment variable in the commands below.

- **Compose the supergraph locally**:

  ```bash
  export DATUM_TOKEN=your-token
  export DATUM_BASE_URL=https://api.staging.env.datum.net
  npm run supergraph:compose
  ```

- **Run the gateway locally (no Docker)**:

  ```bash
  npm run dev
  ```

- **Build and run via Docker**:

  ```bash
  export DATUM_TOKEN=your-token
  export DATUM_BASE_URL=https://api.staging.env.datum.net
  npm run start:gateway
  ```
