const AWS = require('aws-sdk');

class AWSService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadToS3(bucketName, key, data) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: data,
      ACL: "public-read",
      ContentType: "text/csv"
    };

    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }
}

module.exports = new AWSService();
