import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// GLOBAL STATE
// ======================================================

let selectedRole = "farmer";


// ======================================================
// ROLE SELECTION
// ======================================================

function selectRole(role) {

    selectedRole = role;

    const farmerRole =
        document.getElementById("farmerRole");

    const officialRole =
        document.getElementById("officialRole");

    const idLabel =
        document.getElementById("idLabel");

    const userId =
        document.getElementById("userId");


    // Remove active state
    farmerRole.classList.remove("active");
    officialRole.classList.remove("active");


    // Farmer
    if (role === "farmer") {

        farmerRole.classList.add("active");

        idLabel.textContent = "Customer ID";

        userId.placeholder =
            "Enter Customer ID";

    }


    // Official
    else if (role === "official") {

        officialRole.classList.add("active");

        idLabel.textContent = "Official ID";

        userId.placeholder =
            "Enter Official ID";

    }
}


// Make available to HTML onclick
window.selectRole = selectRole;


// ======================================================
// PASSWORD VISIBILITY
// ======================================================

function togglePassword() {

    const password =
        document.getElementById("password");


    if (password.type === "password") {

        password.type = "text";

    }

    else {

        password.type = "password";

    }
}


// Make available to HTML onclick
window.togglePassword = togglePassword;


// ======================================================
// FIND USER BY CUSTOMER ID / OFFICIAL ID
// ======================================================

async function findUserByLoginId(loginId) {

    const usersRef =
        collection(db, "users");


    // Decide which Firestore field to search
    let idField;


    if (selectedRole === "farmer") {

        idField = "customerId";

    }

    else {

        idField = "officialId";

    }


    // Query Firestore
    const q = query(
        usersRef,
        where(idField, "==", loginId)
    );


    const snapshot =
        await getDocs(q);


    // No user found
    if (snapshot.empty) {

        return null;

    }


    // We expect one matching account
    const userDoc =
        snapshot.docs[0];


    return {

        uid: userDoc.id,

        data: userDoc.data()

    };

}


// ======================================================
// FORGOT PASSWORD
// ======================================================

async function forgotPassword() {

    const enteredId =
        document
            .getElementById("userId")
            .value
            .trim();


    if (!enteredId) {

        alert(
            "Please enter your Customer ID first."
        );

        return;

    }


    try {

        // Find account using Customer ID
        // or Official ID
        const user =
            await findUserByLoginId(
                enteredId
            );


        if (!user) {

            alert(
                "No account was found with this ID."
            );

            return;

        }


        // Check role
        if (
            user.data.role !==
            selectedRole
        ) {

            alert(
                "This ID belongs to a different account type."
            );

            return;

        }


        // Email stored in Firestore
        const email =
            user.data.email;


        if (!email) {

            alert(
                "No email address is associated with this account."
            );

            return;

        }


        // Firebase password reset
        await sendPasswordResetEmail(
            auth,
            email
        );


        alert(
            "Password reset email has been sent to your registered email address."
        );


    }

    catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        if (
            error.code ===
            "auth/invalid-email"
        ) {

            alert(
                "The registered email address is invalid."
            );

        }

        else {

            alert(
                "Unable to send password reset email. Please try again."
            );

        }

    }

}


// Make available to HTML onclick
window.forgotPassword = forgotPassword;


// ======================================================
// LOGIN
// ======================================================

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ------------------------------------------
            // GET INPUTS
            // ------------------------------------------

            const enteredId =
                document
                    .getElementById("userId")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------

            if (!enteredId) {

                alert(
                    selectedRole === "farmer"
                        ? "Please enter your Customer ID."
                        : "Please enter your Official ID."
                );

                return;

            }


            if (!password) {

                alert(
                    "Please enter your password."
                );

                return;

            }


            // Disable login button while processing
            const loginButton =
                document.querySelector(
                    ".login-btn"
                );


            const originalText =
                loginButton.textContent;


            loginButton.disabled = true;

            loginButton.textContent =
                "Logging in...";


            try {

                // --------------------------------------
                // FIND USER IN FIRESTORE
                // --------------------------------------

                const user =
                    await findUserByLoginId(
                        enteredId
                    );


                if (!user) {

                    alert(
                        selectedRole === "farmer"
                            ? "No farmer account found with this Customer ID."
                            : "No official account found with this Official ID."
                    );

                    return;

                }


                // --------------------------------------
                // CHECK ROLE
                // --------------------------------------

                if (
                    user.data.role !==
                    selectedRole
                ) {

                    alert(
                        "This account belongs to a different user type."
                    );

                    return;

                }


                // --------------------------------------
                // GET EMAIL
                // --------------------------------------

                const email =
                    user.data.email;


                if (!email) {

                    alert(
                        "This account does not have a registered email address."
                    );

                    return;

                }


                // --------------------------------------
                // FIREBASE AUTHENTICATION
                // --------------------------------------

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const firebaseUser =
                    userCredential.user;


                console.log(
                    "Login successful"
                );


                console.log(
                    "Firebase UID:",
                    firebaseUser.uid
                );


                console.log(
                    "Role:",
                    user.data.role
                );


                // --------------------------------------
                // SAVE BASIC SESSION DATA
                // --------------------------------------

                sessionStorage.setItem(
                    "userId",
                    enteredId
                );


                sessionStorage.setItem(
                    "role",
                    user.data.role
                );


                sessionStorage.setItem(
                    "name",
                    user.data.name || ""
                );


                sessionStorage.setItem(
                    "firebaseUid",
                    firebaseUser.uid
                );


                // --------------------------------------
                // REDIRECT
                // --------------------------------------

                if (
                    selectedRole ===
                    "farmer"
                ) {

                    window.location.href =
                        "farmer.html";

                }

                else {

                    window.location.href =
                        "official.html";

                }

            }


            // ------------------------------------------
            // LOGIN ERROR
            // ------------------------------------------

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    alert(
                        "Incorrect ID or password."
                    );

                }

                else if (
                    error.code ===
                    "auth/user-disabled"
                ) {

                    alert(
                        "This account has been disabled."
                    );

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    alert(
                        "Too many login attempts. Please try again later."
                    );

                }

                else {

                    alert(
                        "Login failed. Please try again."
                    );

                }

            }


            // ------------------------------------------
            // RESTORE LOGIN BUTTON
            // ------------------------------------------

            finally {

                loginButton.disabled = false;

                loginButton.textContent =
                    originalText;

            }

        }
    );