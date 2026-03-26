import base64
from google.cloud import aiplatform
from google.cloud.aiplatform.gapic.schema import predict

def predict_crop_stress(
    project: str,
    endpoint_id: str,
    image_content: bytes,
    location: str = "us-central1"
):
    """
    Calls a deployed Vertex AI custom model endpoint for crop stress classification.
    """
    client_options = {"api_endpoint": f"{location}-aiplatform.googleapis.com"}
    client = aiplatform.gapic.PredictionServiceClient(client_options=client_options)
    
    # Encode image to base64
    encoded_content = base64.b64encode(image_content).decode("utf-8")
    
    instance = predict.instance.ImageClassificationPredictionInstance(
        content=encoded_content,
    ).to_value()
    
    instances = [instance]
    parameters = predict.params.ImageClassificationPredictionParams(
        confidence_threshold=0.5,
        max_predictions=5,
    ).to_value()

    endpoint = client.endpoint_path(
        project=project, location=location, endpoint=endpoint_id
    )
    
    response = client.predict(
        endpoint=endpoint, instances=instances, parameters=parameters
    )
    
    predictions = response.predictions
    for prediction in predictions:
        print(f"Prediction: {prediction}")
        
    return predictions

# Example usage:
# with open("leaf_sample.jpg", "rb") as f:
#     content = f.read()
# predict_crop_stress("my-project", "123456789", content)
