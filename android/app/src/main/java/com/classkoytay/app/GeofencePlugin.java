package com.classkoytay.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "Geofence",
    permissions = {
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }),
        @Permission(alias = "background", strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION })
    }
)
public class GeofencePlugin extends Plugin {

    @PluginMethod
    public void setFences(PluginCall call) {
        JSArray fences = call.getArray("fences");
        if (fences == null || fences.length() == 0) { call.reject("No fences"); return; }
        if (!GeofenceStore.hasPermissions(getContext())) { call.reject("Location 'Allow all the time' permission is required", "NO_PERMISSION"); return; }
        long now = System.currentTimeMillis();
        GeofenceStore.prefs(getContext()).edit()
            .putString("fences", fences.toString())
            .putBoolean("active", true)
            .putLong("armedAt", now)
            .apply();
        boolean ok = GeofenceStore.register(getContext());
        JSObject r = new JSObject();
        r.put("ok", ok);
        r.put("armedAt", now);
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        GeofenceStore.unregister(getContext());
        GeofenceStore.prefs(getContext()).edit().putBoolean("active", false).putString("inside", "").apply();
        GeofenceStore.addEvent(getContext(), "_system", "stopped");
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("active", GeofenceStore.prefs(getContext()).getBoolean("active", false));
        r.put("armedAt", GeofenceStore.prefs(getContext()).getLong("armedAt", 0));
        r.put("inside", GeofenceStore.prefs(getContext()).getString("inside", ""));
        r.put("permission", GeofenceStore.hasPermissions(getContext()));
        r.put("fine", getPermissionState("location") == PermissionState.GRANTED);
        r.put("background", Build.VERSION.SDK_INT < 29 || getPermissionState("background") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void getEvents(PluginCall call) {
        try {
            JSONArray arr = new JSONArray(GeofenceStore.prefs(getContext()).getString("events", "[]"));
            JSArray out = new JSArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject e = arr.getJSONObject(i);
                JSObject o = new JSObject();
                o.put("t", e.getLong("t"));
                o.put("id", e.getString("id"));
                o.put("type", e.getString("type"));
                out.put(o);
            }
            JSObject r = new JSObject();
            r.put("events", out);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }
}
