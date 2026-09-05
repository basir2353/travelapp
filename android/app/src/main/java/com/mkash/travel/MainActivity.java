package com.mkash.travel;

import android.graphics.Color;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Edge-to-edge: system bars overlay the WebView.
    // Safe-area CSS vars (--safe-area-inset-*) come from Capacitor SystemBars
    // (insetsHandling: css) with correct density conversion — do not re-inject
    // raw pixel insets here (that inflated top padding / double-spacing).
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    getWindow().setStatusBarColor(Color.TRANSPARENT);
    getWindow().setNavigationBarColor(Color.TRANSPARENT);

    WindowInsetsControllerCompat controller =
      WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (controller != null) {
      controller.show(WindowInsetsCompat.Type.systemBars());
      controller.setAppearanceLightStatusBars(true);
      controller.setAppearanceLightNavigationBars(true);
      controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_DEFAULT);
    }
  }
}
