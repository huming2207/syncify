# Documentation

## `.env` - Configuration file

| Configuration parameters   | Default value                     | Comment                                             |
| -------------------------- | --------------------------------- | --------------------------------------------------- |
| SYNCIFY_DB_URL             | mongodb://localhost:27017/syncify | MongoDB URL                                         |
| SYNCIFY_JWT_SECRET         | bc9e72e8-9c88                     | JWT Secret, any random string is fine               |
| SYNCIFY_PORT               | 3000                              | Port number that Syncify listens to                 |
| SYNCIFY_STORAGE_BACKEND    | s3                                | Storage backend selection - can be 's3' or 'gridfs' |
| SYNCIFY_STORAGE_BUCKET     | syncify                           | Storage bucket name                                 |
| SYNCIFY_STORAGE_ENDPOINT   | 172.19.0.2                        | (Optional - for S3 only) S3 server endpoint         |
| SYNCIFY_STORAGE_PORT       | 9000                              | (Optional - for S3 only) S3 server port             |
| SYNCIFY_STORAGE_USE_SSL    | false                             | (Optional - for S3 only) S3 server SSL flag         |
| SYNCIFY_STORAGE_ACCESS_KEY | minio                             | (Optional - for S3 only) S3 server access key       |
| SYNCIFY_STORAGE_SECRET_KEY | foobar123456                      | (Optional - for S3 only) S3 server secret key       |
| SYNCIFY_STORAGE_REGION     | us-east-1                         | (Optional - for S3 only) S3 Region                  |

## API Reference

There are two types of 

### Swagger

After server is started, go to [http://127.0.0.1:3000/api/documentation](http://127.0.0.1:3000/api/documentation) for Swagger Web UI.

### Postman 

Import [./Syncify.postman_collection.json](Syncify.postman_collection.json) to your Postman app.
