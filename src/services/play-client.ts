import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/androidpublisher'];

export class PlayClient {
  private auth: GoogleAuth;
  private packageName: string;

  constructor(credentialsPath: string, packageName: string) {
    this.packageName = packageName;
    this.auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });
  }

  getPublisher() {
    return google.androidpublisher({ version: 'v3', auth: this.auth });
  }

  getPackageName() {
    return this.packageName;
  }
}
