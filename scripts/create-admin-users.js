import { createClient } from "@supabase/supabase-js";

// Admin user creation script
// Run this script to create admin and counselor accounts
//
// SETUP INSTRUCTIONS:
// 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dpqgltdclemskpvwolpi
// 2. Navigate to Settings → API
// 3. Copy the "service_role" key (NOT the anon/public key)
// 4. Replace "YOUR_SERVICE_ROLE_KEY_HERE" below with your actual service role key
// 5. The service role key looks like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcWdsdGRjbGVtc2twdndvbHBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk2OTcxNCwiZXhwIjoyMDc0NTQ1NzE0fQ...

const supabaseUrl = "https://dpqgltdclemskpvwolpi.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcWdsdGRjbGVtc2twdndvbHBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk2OTcxNCwiZXhwIjoyMDc0NTQ1NzE0fQ.IwA-AjyheiLZRHdexQMNu9ozkZQ1I3Z_MKmSYA9bz14";

// Validate that the service key was updated
if (supabaseServiceKey === "YOUR_SERVICE_ROLE_KEY_HERE") {
  console.error(
    "❌ ERROR: You need to update the service role key in this script!"
  );
  console.error("📋 Instructions:");
  console.error(
    "1. Go to: https://supabase.com/dashboard/project/dpqgltdclemskpvwolpi/settings/api"
  );
  console.error("2. Copy the 'service_role' key (NOT the anon key)");
  console.error("3. Replace 'YOUR_SERVICE_ROLE_KEY_HERE' in this script");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUsers() {
  const adminUsers = [
    {
      email: "admin@wellnessspace.com",
      password: "AdminPass123!",
      role: "super_admin",
      display_name: "System Administrator",
    },
    {
      email: "dr.ananya@wellnessspace.com",
      password: "CounselorPass123!",
      role: "counselor",
      display_name: "Dr. Ananya Sharma",
    },
    {
      email: "dr.rajesh@wellnessspace.com",
      password: "CounselorPass123!",
      role: "counselor",
      display_name: "Dr. Rajesh Kumar",
    },
  ];

  for (const user of adminUsers) {
    try {
      // Try to create user account first
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

      let userId;

      if (authError && authError.code === "email_exists") {
        console.log(`👤 User ${user.email} already exists, updating role...`);

        // Get existing user by email
        const { data: existingUsers, error: listError } =
          await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(`Error finding user ${user.email}:`, listError);
          continue;
        }

        const existingUser = existingUsers.users.find(
          (u) => u.email === user.email
        );
        if (!existingUser) {
          console.error(`Could not find existing user ${user.email}`);
          continue;
        }

        userId = existingUser.id;
      } else if (authError) {
        console.error(`Error creating user ${user.email}:`, authError);
        continue;
      } else {
        console.log(`✅ Created new user: ${user.email}`);
        userId = authUser.user.id;
      }

      // Update profile with role (create profile if it doesn't exist)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        role: user.role,
        display_name: user.display_name,
      });

      if (profileError) {
        console.error(
          `Error updating profile for ${user.email}:`,
          profileError
        );
      } else {
        console.log(`✅ Updated role for ${user.email}: ${user.role}`);
      }
    } catch (error) {
      console.error(`Error processing ${user.email}:`, error);
    }
  }
}

// Run the script
console.log("🚀 Starting admin user creation...");
console.log("📊 Project URL:", supabaseUrl);

createAdminUsers()
  .then(() => {
    console.log("\n✅ Admin user creation completed!");
    console.log("🎯 You can now sign in with these accounts:");
    console.log("   📧 admin@wellnessspace.com (Super Admin)");
    console.log("   📧 dr.ananya@wellnessspace.com (Counselor)");
    console.log("   📧 dr.rajesh@wellnessspace.com (Counselor)");
    console.log(
      "🔐 Default password for all: Use the passwords set in the script"
    );
    console.log("🎛️  Access admin dashboard at: http://localhost:8080/admin");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error creating admin users:", error);
    console.error("💡 Make sure you've added the correct service role key!");
    process.exit(1);
  });
