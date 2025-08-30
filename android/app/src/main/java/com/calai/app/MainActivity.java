package com.calai.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Forward getUserMedia() permission requests (camera/mic) to Android
    getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }
    });
  }
}
