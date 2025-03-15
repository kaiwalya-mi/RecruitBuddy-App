# Build stage
FROM rust:1.68-slim as builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml .

# Create a dummy main.rs to build dependencies
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src src

# Build the actual application
RUN cargo build --release

# Runtime stage
FROM debian:bullseye-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/skill_validation_backend /app/skill_validation_backend

# Expose the port
EXPOSE 8080

# Run the application
CMD ["/app/skill_validation_backend"]