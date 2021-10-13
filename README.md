# sportstracker-gpx-uploader

This projects purpose is to test uploading exercises (gpx-files) to [http://www.sports-tracker.com](Sports-Tracker).
Implented as a Azure Function with Node and Puppeteer kind of like a RPA-solution, since Sports-Tracker don't offer api to upload exercises.

For an Function App use Linux consumption function app with Node.js as runtime and 12 LTS as version.

Example of local.settings.json for running locally:
    {
        "IsEncrypted": false,
        "Values": {
            "AzureWebJobsStorage": "",
            "FUNCTIONS_WORKER_RUNTIME": "node",

            "stUser": "<sports tracker username>",
            "stPassword": "<sports tracker password>",
            "stLoginUrl": "",
            "tmpfilepath": ""
            }
    }

