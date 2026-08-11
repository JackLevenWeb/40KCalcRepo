import azure.functions as func
import logging
import json

# Initialize the Function App using the modern v2 model
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Create an HTTP trigger endpoint at the route: http://<domain>/api/telemetry
@app.route(route="telemetry", methods=["POST"])
def telemetry(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function is processing a request.')

    try:
        # Extract the JSON payload sent from your frontend telemetry-manager.js
        req_body = req.get_json()
        
        # Pull out the batch_id and the distributions array to verify we got the data
        batch_id = req_body.get('batch_id')
        distributions = req_body.get('distributions')

        if not batch_id or not distributions:
            return func.HttpResponse(
                "Invalid payload. Missing 'batch_id' or 'distributions'.",
                status_code=400
            )

        logging.info(f"Successfully received batch_id: {batch_id} with {len(distributions)} simulation records.")

        # NEXT STEP: We will add the pyodbc database insertion logic right here!

        # Return a success message back to the frontend
        return func.HttpResponse(
            json.dumps({"status": "success", "message": f"Batch {batch_id} processed."}),
            mimetype="application/json",
            status_code=200
        )

    except ValueError:
        # Catch any errors if the frontend sent bad JSON formatting
        return func.HttpResponse(
            "Invalid JSON format received.",
            status_code=400
        )
    except Exception as e:
        # Log unexpected errors for debugging in Application Insights
        logging.error(f"Error processing telemetry: {str(e)}")
        return func.HttpResponse(
            "An internal error occurred.",
            status_code=500
        )