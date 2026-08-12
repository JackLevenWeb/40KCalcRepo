import azure.functions as func
import logging
import json
import os
import pyodbc

#Initialize the Function App using the modern v2 model
#serverless app
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# create an http trigger endpoint at the route: http://localhost:8080/api/telemetry
@app.route(route="telemetry", methods=["POST"])
def telemetry(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('python http trigger function is processing a request.')

    try:
        # extract the json payload sent from your frontend
        req_body = req.get_json()
        
        # pull out the batch_id and the distributions array safely
        batch_id = req_body.get('batch_id')
        distributions = req_body.get('distributions')

        # check if either piece of data is missing
        if not batch_id or not distributions:
            return func.HttpResponse(
                "invalid payload. missing 'batch_id' or 'distributions'.",
                status_code=400
            )

        # print a formatted string to the terminal showing what we caught
        logging.info(f"received batch_id: {batch_id} with {len(distributions)} records.")

    
        
        # 1. grab the connection string (this is exactly like process.env in node.js!)
        conn_string = os.environ.get("SqlConnectionString")
        
        # 2. open a secure network connection to the database api
        conn = pyodbc.connect(conn_string)
        
        # 3. create a cursor. a cursor is the messenger that carries our sql commands to the server.
        cursor = conn.cursor()
        
        # 4. create the table if it does not exist
        # using triple quotes in python allows multi-line strings (just like backticks ` in js template literals)
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DiceRolls' and xtype='U')
            CREATE TABLE DiceRolls (
                BatchId VARCHAR(50),
                RollValue INT,
                RollCount INT
            )
        """)
        
        # 5. loop through the array (this works exactly like a .foreach() array method or a for...of loop in js)
        for dist in distributions:
            # the question marks (?) are parameter placeholders. they prevent sql injection attacks.
            cursor.execute("""
                INSERT INTO DiceRolls (BatchId, RollValue, RollCount)
                VALUES (?, ?, ?)
            """, batch_id, dist.get("roll"), dist.get("count"))
            
        # 6. commit the save and close the connection (crucial for cleaning up api resources)
        conn.commit()
        cursor.close()
        conn.close()
        # ---------------------------------------

        # return a final success message back to the frontend (like res.send() in express.js)
        import json
        return func.HttpResponse(
            json.dumps({"status": "success", "message": f"batch {batch_id} processed and saved to database!"}),
            mimetype="application/json",
            status_code=200
        )

        # return a success message back to the frontend
        return func.HttpResponse(
            "we caught the json data successfully!",
            status_code=200
        )

    except ValueError:
        # catch any errors if the frontend sent bad json formatting
        return func.HttpResponse(
            "invalid json format received.",
            status_code=400
        )
    
           