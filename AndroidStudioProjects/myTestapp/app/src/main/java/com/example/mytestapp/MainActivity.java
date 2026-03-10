package com.example.mytestapp;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

public class MainActivity extends AppCompatActivity {

    Button Next ;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        FirebaseDatabase database;
        DatabaseReference myRef;

        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        Next = findViewById(R.id.btn_start);

        Next.setOnClickListener(v -> {
            Intent i = new Intent(MainActivity.this, Login.class);
            startActivity(i);
        });

        database = FirebaseDatabase.getInstance();
        myRef = database.getReference("Message");
        myRef.setValue("Hello");

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }
}
