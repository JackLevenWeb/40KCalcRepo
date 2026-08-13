import azure.functions as func
import logging
import json
import os
# import the custom service we just built
from services import process_telemetry_payload

# initialize serverless app
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="telemetry", methods=["POST"])
def telemetry(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('python http trigger is processing a request')

    try:
        # extract the json payload
        req_body = req.get_json()
        
        # grab the connection string like process env in js
        conn_string = os.environ.get("SqlConnectionString")
        
        # pass the data to our isolated service logic
        process_telemetry_payload(conn_string, req_body)

        # return 200 success back to telemetry manager js
        return func.HttpResponse(
            json.dumps({"status": "success", "message": "payload processed"}),
            mimetype="application/json",
            status_code=200
        )

    except ValueError:
        return func.HttpResponse(
            "invalid json format received",
            status_code=400
        )
    except Exception as e:
        # catch any sql or processing errors and return a 500 status
        logging.error(f"database insertion failed {str(e)}")
        return func.HttpResponse(
            f"server error {str(e)}",
            status_code=500
        )