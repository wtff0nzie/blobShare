# blobShare

## Because a blob shared is a bigger blob.

BlobShare is a RESTful JSON store, because, oddly I needed one.

PUT / POST new blob

    curl -v -H "Content-Type: application/json" -X PUT -d '{"todo":{"subject":"build todo thingy"}}' \
    http://blobshare.rocks/test-blob


GET existing blob

    http://blobshare.rocks/test-blob


PATCH an existing blob

    curl -v -H "Content-Type: application/json" -X PATCH -d '{"todont":{"subject":"Re-watch SouthPark season 18."},"wiggle":1}' \
    http://blobshare.rocks/test-blob


DELETE an existing blob

    curl -X DELETE http://blobshare.rocks/test-blob
