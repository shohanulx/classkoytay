package com.classkoytay.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationServices;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/** Persists fences + enter/exit events in SharedPreferences and (re)registers them with Play Services. */
public final class GeofenceStore {
    private static final String PREFS = "classkoytay_geofence";
    private static final int MAX_EVENTS = 800;

    private GeofenceStore() {}

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static boolean hasPermissions(Context c) {
        boolean fine = ContextCompat.checkSelfPermission(c, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean bg = Build.VERSION.SDK_INT < 29 || ContextCompat.checkSelfPermission(c, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return fine && bg;
    }

    static PendingIntent pendingIntent(Context c) {
        Intent i = new Intent(c, GeofenceReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        return PendingIntent.getBroadcast(c, 7, i, flags);
    }

    static JSONArray fences(Context c) {
        try { return new JSONArray(prefs(c).getString("fences", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    /** Registers saved fences. Returns false if permissions are missing or nothing to register. */
    @SuppressLint("MissingPermission")
    static boolean register(Context c) {
        if (!hasPermissions(c)) return false;
        JSONArray arr = fences(c);
        if (arr.length() == 0) return false;
        List<Geofence> list = new ArrayList<>();
        try {
            for (int i = 0; i < arr.length(); i++) {
                JSONObject f = arr.getJSONObject(i);
                list.add(new Geofence.Builder()
                        .setRequestId(f.getString("id"))
                        .setCircularRegion(f.getDouble("lat"), f.getDouble("lng"), (float) Math.max(30, f.getDouble("r")))
                        .setExpirationDuration(Geofence.NEVER_EXPIRE)
                        .setNotificationResponsiveness(30_000)
                        .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER | Geofence.GEOFENCE_TRANSITION_EXIT)
                        .build());
            }
        } catch (Exception e) { return false; }
        GeofencingRequest req = new GeofencingRequest.Builder()
                .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
                .addGeofences(list).build();
        GeofencingClient client = LocationServices.getGeofencingClient(c);
        client.removeGeofences(pendingIntent(c)).addOnCompleteListener(t ->
                client.addGeofences(req, pendingIntent(c))
                        .addOnSuccessListener(v -> addEvent(c, "_system", "armed"))
                        .addOnFailureListener(e -> addEvent(c, "_system", "error:" + e.getMessage())));
        return true;
    }

    static void unregister(Context c) {
        LocationServices.getGeofencingClient(c).removeGeofences(pendingIntent(c));
    }

    static synchronized void addEvent(Context c, String id, String type) {
        try {
            JSONArray arr = new JSONArray(prefs(c).getString("events", "[]"));
            JSONObject e = new JSONObject();
            e.put("t", System.currentTimeMillis());
            e.put("id", id);
            e.put("type", type);
            arr.put(e);
            JSONArray out = arr;
            if (arr.length() > MAX_EVENTS) {
                out = new JSONArray();
                for (int i = arr.length() - MAX_EVENTS; i < arr.length(); i++) out.put(arr.get(i));
            }
            SharedPreferences.Editor ed = prefs(c).edit().putString("events", out.toString());
            if ("enter".equals(type)) ed.putString("inside", id);
            if ("exit".equals(type) && id.equals(prefs(c).getString("inside", ""))) ed.putString("inside", "");
            ed.apply();
        } catch (Exception ignored) { }
    }
}
