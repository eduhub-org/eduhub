async function saveToBucket(filename, bucket, content, isPublic) {

  const file = bucket.file(filename);
  const fileBuffer = new Buffer(content, 'base64');
  
  await file.save(fileBuffer);
  
  let link = "";
  if (isPublic == true) {
    await file.makePublic();
    link = await file.publicUrl();
  } else {
    link = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 1000 * 60 * 5)
    });
  }
  return link;
}

async function loadFromBucket(path, bucket) {  
  const file = bucket.file(path);
  const isPublic = await file.isPublic();
  
  if (isPublic[0] == true) {
    const link = await file.publicUrl();
  } else {
    const link = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 1000 * 60 * 5)
    });
  }
  return link;
}

module.exports = {saveToBucket, loadFromBucket};
