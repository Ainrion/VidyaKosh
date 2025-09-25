# Wasabi Storage Setup for Exam File Uploads

This guide will help you set up Wasabi cloud storage for your LMS exam file upload system.

## Prerequisites

- A Wasabi account (sign up at https://wasabi.com)
- Access to your project's environment configuration

## Step 1: Create a Wasabi Account and Bucket

### 1.1 Sign Up for Wasabi
1. Go to https://wasabi.com
2. Click "Sign Up" and create your account
3. Verify your email address
4. Complete the account setup process

### 1.2 Create a Bucket
1. Log into your Wasabi account
2. Go to the "Buckets" section
3. Click "Create Bucket"
4. Enter a bucket name (e.g., `exam-question-files` or `your-school-name-exam-files`)
5. Choose a region (recommend `us-east-1` for best performance)
6. Click "Create Bucket"

### 1.3 Configure Bucket Settings
1. Go to your bucket settings
2. Enable "Public Read" access for the bucket (this allows students to download question files)
3. Set up CORS if needed (for web uploads)

## Step 2: Create Access Keys

### 2.1 Create IAM User
1. In your Wasabi dashboard, go to "Access Keys" or "IAM"
2. Click "Create Access Key" or "Create User"
3. Give the user a name (e.g., `exam-upload-service`)
4. Attach the `WasabiFullAccess` policy to the user
5. Download and save the Access Key ID and Secret Access Key

### 2.2 Note Your Wasabi Endpoint
- Your Wasabi endpoint will be: `https://s3.wasabisys.com`
- Region: `us-east-1` (or the region you chose)

## Step 3: Configure Environment Variables

### 3.1 Add to .env.local
Add the following variables to your `.env.local` file:

```env
# Wasabi Configuration
WASABI_ACCESS_KEY_ID=your_access_key_id_here
WASABI_SECRET_ACCESS_KEY=your_secret_access_key_here
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_BUCKET_NAME=your_bucket_name_here
```

### 3.2 Example Configuration
```env
# Wasabi Configuration
WASABI_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
WASABI_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_BUCKET_NAME=my-school-exam-files
```

## Step 4: Test the Setup

### 4.1 Install Dependencies
The AWS SDK should already be installed, but if not:
```bash
npm install aws-sdk
```

### 4.2 Test Upload
1. Go to your exam creation page
2. Create a new exam
3. Add a question and select "File Upload" as the question type
4. Upload a test file (PDF, DOC, etc.)
5. Verify the file appears in your Wasabi bucket

### 4.3 Test Download
1. Take the exam as a student
2. Verify that question files are displayed correctly
3. Test downloading/viewing the files

## Step 5: Security Considerations

### 5.1 Bucket Permissions
- Question files are stored with public read access
- Answer files are private and only accessible through the application
- Consider implementing signed URLs for additional security

### 5.2 File Validation
The system validates:
- File types: PDF, DOC, DOCX, TXT, XML, JPG, PNG
- File size: Maximum 50MB per file
- User permissions: Only teachers/admins can upload question files

### 5.3 Access Control
- Teachers and admins can upload question files
- Students can only upload answer files
- File access is controlled through the application's authentication system

## Step 6: Monitoring and Maintenance

### 6.1 Monitor Usage
- Check your Wasabi dashboard regularly for storage usage
- Monitor costs and set up billing alerts if needed

### 6.2 Backup Strategy
- Consider setting up cross-region replication for important files
- Implement regular backup procedures for critical exam data

## Troubleshooting

### Common Issues

#### 1. Upload Fails
- Check your Wasabi credentials
- Verify the bucket name and region
- Ensure the bucket has proper permissions

#### 2. Files Not Displaying
- Check if files are uploaded to the correct bucket
- Verify public read access is enabled
- Check browser console for CORS errors

#### 3. Permission Denied
- Verify IAM user has proper permissions
- Check bucket policy settings
- Ensure environment variables are correctly set

### Debug Steps
1. Check browser network tab for failed requests
2. Verify environment variables in your application
3. Test Wasabi credentials using AWS CLI or SDK
4. Check Wasabi service status

## Cost Optimization

### Tips to Reduce Costs
1. **Lifecycle Policies**: Set up policies to move old files to cheaper storage tiers
2. **Compression**: Compress files before upload when possible
3. **Cleanup**: Regularly delete unused files and old exam data
4. **Monitoring**: Set up billing alerts to track usage

### Estimated Costs
- Storage: ~$5.99/TB/month
- Data transfer: ~$0.04/GB for downloads
- API requests: Minimal cost for most use cases

## Support

For issues with:
- **Wasabi Service**: Contact Wasabi support
- **Application Integration**: Check the application logs and configuration
- **File Upload Problems**: Verify permissions and network connectivity

## Additional Resources

- [Wasabi Documentation](https://docs.wasabi.com/)
- [AWS S3 Compatibility Guide](https://docs.wasabi.com/docs/aws-s3-compatibility)
- [Wasabi Pricing](https://wasabi.com/pricing/)

