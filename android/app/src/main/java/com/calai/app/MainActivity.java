package com.calai.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

import android.webkit.PermissionRequest;

public class MainActivity extends BridgeActivity {

  private static final int REQ_PERMS = 2001;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // 1) Demander les autorisations Android si manquantes
    requestMediaPermissionsIfNeeded();

    // 2) Laisser le WebView accorder getUserMedia (cam/mic) au site chargé
    getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }
    });
  }

  private void requestMediaPermissionsIfNeeded() {
    boolean needCamera = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
        != PackageManager.PERMISSION_GRANTED;
    boolean needMic = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED;

    if (needCamera || needMic) {
      ActivityCompat.requestPermissions(
          this,
          new String[]{ Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO },
          REQ_PERMS
      );
    }
  }
}
