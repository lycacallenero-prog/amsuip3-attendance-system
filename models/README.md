# AI Models Directory

This directory contains ONNX models for signature verification.

## Production Setup

In production, you should place your trained signature embedding model here:

- `signature_embedding.onnx` - The main signature embedding model (512-dimensional output)

## Model Requirements

The signature embedding model should:

1. Accept input shape: `[1, 1, 128, 256]` (batch_size, channels, height, width)
2. Input type: `float32`, normalized to [0, 1]
3. Output a 512-dimensional embedding vector
4. Be trained using metric learning (e.g., triplet loss, contrastive loss)

## Development Mode

The service will run in development mode without a model file, generating mock embeddings based on image content for testing purposes.

## Model Training

For production use, you would typically:

1. Collect a large dataset of signature images
2. Train a deep learning model (e.g., ResNet, EfficientNet) using metric learning
3. Export the trained model to ONNX format
4. Place the model file in this directory

Example model architectures that work well for signature verification:
- SigNet (specialized for signatures)
- ResNet-based encoders
- EfficientNet-based encoders
- Custom CNN architectures

The model should be trained to produce embeddings where similar signatures have high cosine similarity and different signatures have low cosine similarity.