/* ============================================================
   PASHU PARICHAY
   OFFICIAL PORTAL
   official.js
   ============================================================ */


/* ============================================================
   FIREBASE IMPORTS
   ============================================================ */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    collectionGroup,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ============================================================
   FIREBASE CONFIG
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDTqrFtIRMqQcbrq5dwbtlHxaHrr5_NObw",
  authDomain: "pashu-parichay-22c48.firebaseapp.com",
  projectId: "pashu-parichay-22c48",
  storageBucket: "pashu-parichay-22c48.firebasestorage.app",
  messagingSenderId: "771547978662",
  appId: "1:771547978662:web:98dac0983e2e3174d8cd67",
  measurementId: "G-3B8W5QJ07L"
};


/* ============================================================
   MAIN FIREBASE APP
   ============================================================ */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* ============================================================
   SECONDARY FIREBASE APP
   ------------------------------------------------------------
   Used only when an official creates a farmer account.

   This prevents createUserWithEmailAndPassword()
   from logging the official out.
   ============================================================ */

const secondaryApp = initializeApp(
    firebaseConfig,
    "farmerCreationApp"
);

const farmerAuth = getAuth(
    secondaryApp
);

const farmerDb = getFirestore(
    secondaryApp
);


/* ============================================================
   GLOBAL VARIABLES
   ============================================================ */

let currentOfficial = null;

let allFarmers = [];

let allAnimals = [];

let allHelpRequests = [];

let statisticsLoaded = false;

let selectedFarmer = null;

let selectedAnimalPhoto = null;


/* ============================================================
   DOM HELPER
   ============================================================ */

function $(id) {

    return document.getElementById(id);

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   DATE FORMAT
   ============================================================ */

function formatDate(value) {

    if (!value) {

        return "—";

    }

    try {

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {

            date = value.toDate();

        } else if (
            value instanceof Date
        ) {

            date = value;

        } else {

            date = new Date(value);

        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch (error) {

        return "—";

    }

}


/* ============================================================
   DATE VALUE
   ============================================================ */

function getDateValue(value) {

    if (!value) {

        return 0;

    }

    try {

        if (
            value &&
            typeof value.toDate === "function"
        ) {

            return value.toDate().getTime();

        }

        const date =
            new Date(value);

        return date.getTime() || 0;

    } catch (error) {

        return 0;

    }

}


/* ============================================================
   ANIMAL EMOJI
   ============================================================ */

function getAnimalEmoji(species) {

    const value =
        String(
            species || ""
        ).toLowerCase();

    if (
        value.includes("buffalo")
    ) {

        return "🐃";

    }

    if (
        value.includes("cattle") ||
        value.includes("cow")
    ) {

        return "🐄";

    }

    return "🐄";

}


/* ============================================================
   AUTHENTICATION
   ============================================================ */

onAuthStateChanged(
    auth,
    async function(user) {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        try {

            await loadOfficialProfile(
                user
            );

            if (!currentOfficial) {

                return;

            }

            await loadDashboardStats();

            await loadFarmers();

            await loadRecentAnimals();

        } catch (error) {

            console.error(
                "Official initialization error:",
                error
            );

        }

    }
);


/* ============================================================
   LOAD OFFICIAL PROFILE
   ============================================================ */

async function loadOfficialProfile(user) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(
                userRef
            );

        if (!snapshot.exists()) {

            alert(
                "Official profile not found."
            );

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }

        const data =
            snapshot.data();

        if (
            data.role !== "official"
        ) {

            alert(
                "Access denied. This portal is for officials only."
            );

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }

        currentOfficial = {

            id:
                user.uid,

            name:
                data.name ||
                data.fullName ||
                user.displayName ||
                "Official",

            officialId:
                data.officialId ||
                data.customerId ||
                user.uid

        };

        updateOfficialUI();

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        alert(
            "Unable to load official profile."
        );

    }

}


/* ============================================================
   UPDATE OFFICIAL UI
   ============================================================ */

function updateOfficialUI() {

    if (!currentOfficial) {

        return;

    }

    const name =
        currentOfficial.name;

    const officialId =
        currentOfficial.officialId;

    const officialName =
        $("officialName");

    const welcomeName =
        $("welcomeName");

    const officialIdElement =
        $("officialId");

    if (officialName) {

        officialName.textContent =
            name;

    }

    if (welcomeName) {

        welcomeName.textContent =
            name;

    }

    if (officialIdElement) {

        officialIdElement.textContent =
            officialId;

    }

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function setActiveNav(text) {

    const buttons =
        document.querySelectorAll(
            ".nav-item"
        );

    buttons.forEach(
        function(button) {

            button.classList.remove(
                "active"
            );

            if (
                button.textContent
                    .trim()
                    .toLowerCase()
                    .includes(
                        text.toLowerCase()
                    )
            ) {

                button.classList.add(
                    "active"
                );

            }

        }
    );

}


/* ============================================================
   SHOW DASHBOARD
   ============================================================ */

function showDashboard() {

    setActiveNav(
        "Dashboard"
    );

    const title =
        $("pageTitle");

    if (title) {

        title.textContent =
            "Dashboard";

    }

    showElement(
        "dashboardSection"
    );

    showElement(
        "farmersSection"
    );

    showElement(
        "animalsSection"
    );

    showElement(
        "helpRequestsSection",
        false
    );

    showElement(
        "settingsSection",
        false
    );

}


/* ============================================================
   SHOW FARMERS
   ============================================================ */

async function showFarmers() {

    setActiveNav(
        "Farmers"
    );

    const title =
        $("pageTitle");

    if (title) {

        title.textContent =
            "Farmers";

    }

    showElement(
        "dashboardSection"
    );

    showElement(
        "farmersSection"
    );

    showElement(
        "animalsSection",
        false
    );

    showElement(
        "helpRequestsSection",
        false
    );

    showElement(
        "settingsSection",
        false
    );

    await loadFarmers();

}


/* ============================================================
   SHOW ANIMALS
   ============================================================ */

async function showAnimals() {

    setActiveNav(
        "Animals"
    );

    const title =
        $("pageTitle");

    if (title) {

        title.textContent =
            "Animals";

    }

    showElement(
        "dashboardSection"
    );

    showElement(
        "farmersSection",
        false
    );

    showElement(
        "animalsSection"
    );

    showElement(
        "helpRequestsSection",
        false
    );

    showElement(
        "settingsSection",
        false
    );

    await loadRecentAnimals();

}


/* ============================================================
   SHOW HELP REQUESTS
   ============================================================ */

async function showHelpRequests() {

    setActiveNav(
        "Help Requests"
    );

    const title =
        $("pageTitle");

    if (title) {

        title.textContent =
            "Help Requests";

    }

    showElement(
        "dashboardSection",
        false
    );

    showElement(
        "farmersSection",
        false
    );

    showElement(
        "animalsSection",
        false
    );

    showElement(
        "helpRequestsSection"
    );

    showElement(
        "settingsSection",
        false
    );

    await loadHelpRequests();

}


/* ============================================================
   SHOW SETTINGS
   ============================================================ */

function showSettings() {

    setActiveNav(
        "Settings"
    );

    const title =
        $("pageTitle");

    if (title) {

        title.textContent =
            "Settings";

    }

    showElement(
        "dashboardSection",
        false
    );

    showElement(
        "farmersSection",
        false
    );

    showElement(
        "animalsSection",
        false
    );

    showElement(
        "helpRequestsSection",
        false
    );

    showElement(
        "settingsSection"
    );

}


/* ============================================================
   GENERIC SHOW/HIDE
   ============================================================ */

function showElement(
    id,
    visible = true
) {

    const element =
        $(id);

    if (!element) {

        return;

    }

    if (visible) {

        element.style.display = "";

    } else {

        element.style.display = "none";

    }

}


/* ============================================================
   EXPORT NAV FUNCTIONS
   ============================================================ */

window.showDashboard =
    showDashboard;

window.showFarmers =
    showFarmers;

window.showAnimals =
    showAnimals;

window.showHelpRequests =
    showHelpRequests;

window.showSettings =
    showSettings;


/* ============================================================
   DASHBOARD STATISTICS
   ============================================================ */

async function loadDashboardStats() {

    try {

        /* =====================================================
           FARMERS
           ===================================================== */

        const farmerQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "role",
                    "==",
                    "farmer"
                )
            );

        const farmerSnapshot =
            await getDocs(
                farmerQuery
            );

        const farmerCount =
            farmerSnapshot.size;

        const totalFarmers =
            $("totalFarmers");

        if (totalFarmers) {

            totalFarmers.textContent =
                farmerCount;

        }


        /* =====================================================
           LIVESTOCK
           ===================================================== */

        const livestockSnapshot =
            await getDocs(
                collectionGroup(
                    db,
                    "livestock"
                )
            );

        let cattleCount = 0;

        let buffaloCount = 0;

        livestockSnapshot.forEach(
            function(animalDoc) {

                const animal =
                    animalDoc.data();

                const species =
                    String(
                        animal.species || ""
                    ).toLowerCase();

                if (
                    species === "cattle" ||
                    species === "cow"
                ) {

                    cattleCount++;

                }

                if (
                    species === "buffalo"
                ) {

                    buffaloCount++;

                }

            }
        );


        const totalAnimals =
            livestockSnapshot.size;

        const totalAnimalsElement =
            $("totalAnimals");

        const totalCattleElement =
            $("totalCattle");

        const totalBuffaloElement =
            $("totalBuffalo");


        if (totalAnimalsElement) {

            totalAnimalsElement.textContent =
                totalAnimals;

        }

        if (totalCattleElement) {

            totalCattleElement.textContent =
                cattleCount;

        }

        if (totalBuffaloElement) {

            totalBuffaloElement.textContent =
                buffaloCount;

        }


        allAnimals =
            livestockSnapshot.docs.map(
                function(item) {

                    return {

                        id:
                            item.id,

                        ...item.data()

                    };

                }
            );

    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

    }

}


/* ============================================================
   LOAD FARMERS
   ============================================================ */

async function loadFarmers() {

    const farmerList =
        $("farmerList");

    if (!farmerList) {

        return;

    }

    try {

        const farmerQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "role",
                    "==",
                    "farmer"
                )
            );

        const snapshot =
            await getDocs(
                farmerQuery
            );

        allFarmers =
            snapshot.docs.map(
                function(item) {

                    return {

                        id:
                            item.id,

                        ...item.data()

                    };

                }
            );


        if (snapshot.empty) {

            farmerList.innerHTML = `

                <div class="empty-state">

                    <div>
                        👨‍🌾
                    </div>

                    <h4>
                        No farmers registered
                    </h4>

                    <p>
                        Registered farmers will appear here.
                    </p>

                </div>

            `;

            return;

        }


        renderFarmers(
            allFarmers
        );

    } catch (error) {

        console.error(
            "Farmer loading error:",
            error
        );

        farmerList.innerHTML = `

            <div class="empty-state">

                <div>
                    ⚠️
                </div>

                <h4>
                    Unable to load farmers
                </h4>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


/* ============================================================
   RENDER FARMERS
   ============================================================ */

function renderFarmers(
    farmers
) {

    const farmerList =
        $("farmerList");

    if (!farmerList) {

        return;

    }

    if (
        !farmers ||
        farmers.length === 0
    ) {

        farmerList.innerHTML = `

            <div class="empty-state">

                <div>
                    🔍
                </div>

                <h4>
                    No matching farmers
                </h4>

                <p>
                    Try another search.
                </p>

            </div>

        `;

        return;

    }


    farmerList.innerHTML =
        farmers.map(
            function(farmer) {

                const name =
                    farmer.name ||
                    farmer.fullName ||
                    farmer.displayName ||
                    "Farmer";


                const customerId =
                    farmer.customerId ||
                    farmer.farmerId ||
                    farmer.id ||
                    "—";


                const phone =
                    farmer.phone ||
                    farmer.mobile ||
                    farmer.phoneNumber ||
                    "No phone number";


                return `

                    <div
                        class="farmer-item"
                        onclick="openFarmerDetails('${escapeHtml(
                            farmer.id
                        )}')"
                    >

                        <div
                            class="farmer-item-left"
                        >

                            <div
                                class="farmer-avatar"
                            >
                                👨‍🌾
                            </div>


                            <div
                                class="farmer-item-info"
                            >

                                <strong>
                                    ${escapeHtml(
                                        name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        phone
                                    )}
                                </small>

                            </div>

                        </div>


                        <span
                            class="farmer-customer-id"
                        >
                            ${escapeHtml(
                                customerId
                            )}
                        </span>

                    </div>

                `;

            }
        )
        .join("");

}


/* ============================================================
   FARMER SEARCH
   ============================================================ */

const farmerSearch =
    $("farmerSearch");

if (farmerSearch) {

    farmerSearch.addEventListener(
        "input",
        function() {

            const value =
                this.value
                    .trim()
                    .toLowerCase();

            if (!value) {

                renderFarmers(
                    allFarmers
                );

                return;

            }

            const filtered =
                allFarmers.filter(
                    function(farmer) {

                        const text = [

                            farmer.name,

                            farmer.fullName,

                            farmer.customerId,

                            farmer.farmerId,

                            farmer.phone,

                            farmer.mobile,

                            farmer.state,

                            farmer.district

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                        return text.includes(
                            value
                        );

                    }
                );


            renderFarmers(
                filtered
            );

        }
    );

}


/* ============================================================
   OPEN FARMER DETAILS
   ============================================================ */

function openFarmerDetails(
    farmerId
) {

    const farmer =
        allFarmers.find(
            function(item) {

                return item.id === farmerId;

            }
        );


    if (!farmer) {

        alert(
            "Farmer details not found."
        );

        return;

    }


    /*
       We use the same farmerModal from
       the updated official.html.
    */

    const modal =
        $("farmerModal");

    if (!modal) {

        return;

    }


    const name =
        farmer.name ||
        farmer.fullName ||
        farmer.displayName ||
        "Farmer";


    modal.innerHTML = `

        <div class="modal-card">

            <button
                type="button"
                class="close-btn"
                onclick="closeFarmerModal()"
            >
                ×
            </button>

            <div class="modal-icon">
                👨‍🌾
            </div>

            <h2>
                ${escapeHtml(name)}
            </h2>

            <p class="modal-subtitle">
                Farmer profile
            </p>

            <div class="detail-grid">

                <div class="detail-item">

                    <small>
                        Customer ID
                    </small>

                    <strong>
                        ${escapeHtml(
                            farmer.customerId ||
                            farmer.farmerId ||
                            farmer.id ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Phone
                    </small>

                    <strong>
                        ${escapeHtml(
                            farmer.phone ||
                            farmer.mobile ||
                            farmer.phoneNumber ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Email
                    </small>

                    <strong>
                        ${escapeHtml(
                            farmer.email ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        State
                    </small>

                    <strong>
                        ${escapeHtml(
                            farmer.state ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        District
                    </small>

                    <strong>
                        ${escapeHtml(
                            farmer.district ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Address
                    </small>

                    <strong>
                        ${escapeHtml(
                            farmer.address ||
                            "—"
                        )}
                    </strong>

                </div>

            </div>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


window.openFarmerDetails =
    openFarmerDetails;


/* ============================================================
   CLOSE FARMER MODAL
   ============================================================ */

function closeFarmerModal() {

    const modal =
        $("farmerModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeFarmerModal =
    closeFarmerModal;


/* ============================================================
   OPEN ADD FARMER
   ============================================================ */

function openAddFarmer() {

    const modal =
        $("farmerModal");

    if (!modal) {

        return;

    }

    /*
       Restore the registration form if the same
       modal was previously used for details.
    */

    modal.innerHTML = `

        <div class="modal-card">

            <button
                type="button"
                class="close-btn"
                onclick="closeAddFarmer()"
            >
                ×
            </button>

            <div class="modal-icon">
                👨‍🌾
            </div>

            <h2>
                Register New Farmer
            </h2>

            <p class="modal-subtitle">
                Create a farmer account and customer ID.
            </p>

            <form id="farmerForm">

                <label for="farmerName">
                    Farmer Name
                </label>

                <input
                    type="text"
                    id="farmerName"
                    placeholder="Enter farmer name"
                    required
                >


                <label for="farmerPhone">
                    Mobile Number
                </label>

                <input
                    type="tel"
                    id="farmerPhone"
                    placeholder="Enter mobile number"
                    required
                >


                <label for="farmerEmail">
                    Email Address
                </label>

                <input
                    type="email"
                    id="farmerEmail"
                    placeholder="Enter email address"
                    required
                >


                <label for="farmerAddress">
                    Address
                </label>

                <textarea
                    id="farmerAddress"
                    placeholder="Village, district, state..."
                    required
                ></textarea>


                <label for="farmerState">
                    State
                </label>

                <input
                    type="text"
                    id="farmerState"
                    placeholder="Enter state"
                    required
                >


                <label for="farmerDistrict">
                    District
                </label>

                <input
                    type="text"
                    id="farmerDistrict"
                    placeholder="Enter district"
                    required
                >


                <label for="customerId">
                    Customer ID
                </label>

                <input
                    type="text"
                    id="customerId"
                    placeholder="e.g. PP-123456"
                    required
                >


                <small class="field-help">
                    This ID will be used by the farmer to log in.
                </small>


                <label for="farmerPassword">
                    Password
                </label>

                <input
                    type="password"
                    id="farmerPassword"
                    placeholder="Enter farmer password"
                    minlength="6"
                    required
                >


                <small class="field-help">
                    Password must contain at least 6 characters.
                </small>


                <button
                    type="submit"
                    class="modal-submit"
                >
                    Create Farmer
                </button>

            </form>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );


    const form =
        $("farmerForm");

    if (form) {

        form.addEventListener(
            "submit",
            registerFarmer
        );

    }

}


window.openAddFarmer =
    openAddFarmer;


/* ============================================================
   CLOSE ADD FARMER
   ============================================================ */

function closeAddFarmer() {

    const modal =
        $("farmerModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeAddFarmer =
    closeAddFarmer;


/* ============================================================
   REGISTER FARMER
   ------------------------------------------------------------
   IMPORTANT:
   1. Create Firebase Authentication account.
   2. Create Firestore users/{uid}.
   3. Store role = farmer.
   ============================================================ */

async function registerFarmer(event) {

    event.preventDefault();


    if (!currentOfficial) {

        alert(
            "Official profile is not loaded."
        );

        return;

    }


    const name =
        $("farmerName")?.value
            ?.trim();

    const phone =
        $("farmerPhone")?.value
            ?.trim();

    const email =
        $("farmerEmail")?.value
            ?.trim();

    const address =
        $("farmerAddress")?.value
            ?.trim();

    const state =
        $("farmerState")?.value
            ?.trim();

    const district =
        $("farmerDistrict")?.value
            ?.trim();

    const customerId =
        $("customerId")?.value
            ?.trim();

    const password =
        $("farmerPassword")?.value
            ?.trim();


    if (
        !name ||
        !phone ||
        !email ||
        !address ||
        !state ||
        !district ||
        !customerId ||
        !password
    ) {

        alert(
            "Please fill all farmer details."
        );

        return;

    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;

    }


    try {

        const submitButton =
            event.target.querySelector(
                "button[type='submit']"
            );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Creating Farmer...";

        }


        /*
           Check whether Customer ID is already used.
        */

        const existingCustomerQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "customerId",
                    "==",
                    customerId
                )
            );


        const existingCustomerSnapshot =
            await getDocs(
                existingCustomerQuery
            );


        if (
            !existingCustomerSnapshot.empty
        ) {

            throw new Error(
                "Customer ID already exists."
            );

        }


        /*
           Create Firebase Authentication account
           using the SECONDARY Firebase app.
        */

        const credential =
            await createUserWithEmailAndPassword(
                farmerAuth,
                email,
                password
            );


        const farmerUser =
            credential.user;


        /*
           Create Firestore user document.
        */

        await setDoc(
            doc(
                db,
                "users",
                farmerUser.uid
            ),
            {

                uid:
                    farmerUser.uid,

                name:
                    name,

                fullName:
                    name,

                email:
                    email,

                phone:
                    phone,

                address:
                    address,

                state:
                    state,

                district:
                    district,

                customerId:
                    customerId,

                role:
                    "farmer",

                createdBy:
                    currentOfficial.id,

                createdAt:
                    serverTimestamp()

            }
        );


        /*
           Create livestock subcollection placeholder
           is NOT required.

           Animals will be stored as:

           users/{farmerUID}/livestock/{animalID}
        */


        alert(
            "Farmer account created successfully."
        );


        event.target.reset();

        closeAddFarmer();


        await loadFarmers();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Farmer registration error:",
            error
        );


        let message =
            "Unable to create farmer.";


        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message =
                "This email is already registered in Firebase Authentication.";

        } else if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "Invalid email address.";

        } else if (
            error.code ===
            "auth/weak-password"
        ) {

            message =
                "Password is too weak.";

        } else if (
            error.message
        ) {

            message =
                error.message;

        }


        alert(
            message
        );

    } finally {

        const submitButton =
            event.target.querySelector(
                "button[type='submit']"
            );

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Farmer";

        }

    }

}


/* ============================================================
   OPEN ANIMAL MODAL
   ============================================================ */

function openAddAnimal() {

    const modal =
        $("animalModal");

    if (!modal) {

        alert(
            "Animal registration modal not found."
        );

        return;

    }

    modal.classList.remove(
        "hidden"
    );


    setupAnimalForm();

}


window.openAddAnimal =
    openAddAnimal;


/* ============================================================
   AI RECOGNITION
   ============================================================ */

function openRecognition() {

    openAddAnimal();

}


window.openRecognition =
    openRecognition;


/* ============================================================
   CLOSE ANIMAL MODAL
   ============================================================ */

function closeAddAnimal() {

    const modal =
        $("animalModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

    selectedFarmer = null;

    selectedAnimalPhoto = null;

}


window.closeAddAnimal =
    closeAddAnimal;


/* ============================================================
   CLOSE ANIMAL DETAILS
   ============================================================ */

function closeAnimalModal() {

    const modal =
        $("animalModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeAnimalModal =
    closeAnimalModal;


/* ============================================================
   SETUP ANIMAL FORM
   ============================================================ */

function setupAnimalForm() {

    const form =
        $("animalForm");

    if (!form) {

        return;

    }


    if (
        form.dataset.initialized ===
        "true"
    ) {

        return;

    }


    form.dataset.initialized =
        "true";


    const findFarmerBtn =
        $("findFarmerBtn");

    if (findFarmerBtn) {

        findFarmerBtn.addEventListener(
            "click",
            findFarmer
        );

    }


    const cameraInput =
        $("animalCameraInput");

    const uploadInput =
        $("animalUploadInput");


    if (cameraInput) {

        cameraInput.addEventListener(
            "change",
            handleAnimalPhoto
        );

    }


    if (uploadInput) {

        uploadInput.addEventListener(
            "change",
            handleAnimalPhoto
        );

    }


    form.addEventListener(
        "submit",
        saveAnimal
    );

}


/* ============================================================
   FIND FARMER
   ============================================================ */

async function findFarmer() {

    const customerId =
        $("animalCustomerId")
            ?.value
            ?.trim();


    const result =
        $("farmerResult");


    if (!customerId) {

        alert(
            "Enter Farmer Customer ID."
        );

        return;

    }


    try {

        const farmerQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "customerId",
                    "==",
                    customerId
                ),
                where(
                    "role",
                    "==",
                    "farmer"
                )
            );


        const snapshot =
            await getDocs(
                farmerQuery
            );


        if (
            snapshot.empty
        ) {

            selectedFarmer =
                null;


            if (result) {

                result.style.display =
                    "block";

                result.style.background =
                    "#fff0f0";

                result.innerHTML = `
                    ❌
                    No farmer found with
                    Customer ID:
                    <strong>
                        ${escapeHtml(
                            customerId
                        )}
                    </strong>
                `;

            }

            return;

        }


        const farmerDoc =
            snapshot.docs[0];


        selectedFarmer = {

            uid:
                farmerDoc.id,

            ...farmerDoc.data()

        };


        if (result) {

            result.style.display =
                "block";

            result.style.background =
                "#eef8ef";

            result.innerHTML = `

                ✅
                Farmer found:

                <strong>
                    ${escapeHtml(
                        selectedFarmer.name ||
                        selectedFarmer.fullName ||
                        "Farmer"
                    )}
                </strong>

                <br>

                State:
                ${escapeHtml(
                    selectedFarmer.state ||
                    "—"
                )}

                <br>

                District:
                ${escapeHtml(
                    selectedFarmer.district ||
                    "—"
                )}

            `;

        }


    } catch (error) {

        console.error(
            "Find farmer error:",
            error
        );

        alert(
            "Unable to find farmer."
        );

    }

}


window.findFarmer =
    findFarmer;


/* ============================================================
   HANDLE ANIMAL PHOTO
   ============================================================ */

async function handleAnimalPhoto(event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    selectedAnimalPhoto =
        file;


    const preview =
        $("animalPreview");


    if (preview) {

        const url =
            URL.createObjectURL(
                file
            );


        preview.innerHTML = `

            <img
                src="${url}"
                alt="Animal preview"
                style="
                    width:100%;
                    max-height:280px;
                    object-fit:contain;
                    border-radius:12px;
                "
            >

        `;

    }


    await runBreedRecognition(
        file
    );

}


/* ============================================================
   TEACHABLE MACHINE MODEL
   ------------------------------------------------------------
   IMPORTANT:
   Replace this URL with the SAME model URL
   used by your working Teachable Machine prototype.
   ============================================================ */

const MODEL_URL =
    "https://teachablemachine.withgoogle.com/models/x_FYO_rKZ/";


/* ============================================================
   RUN BREED RECOGNITION
   ============================================================ */

async function runBreedRecognition(
    file
) {

    const aiResult =
        $("aiResult");

    const aiBreed =
        $("aiBreed");

    const aiConfidence =
        $("aiConfidence");

    const saveButton =
        $("saveAnimalBtn");


    if (!file) {

        return;

    }


    if (
        MODEL_URL.includes(
            "YOUR_TEACHABLE_MACHINE"
        )
    ) {

        /*
           The actual model URL must come from
           your working Teachable Machine prototype.

           We don't invent it here.
        */

        if (aiResult) {

            aiResult.style.display =
                "block";

        }

        if (aiBreed) {

            aiBreed.textContent =
                "Model URL required";

        }

        if (aiConfidence) {

            aiConfidence.textContent =
                "Add your working Teachable Machine model URL in official.js.";

        }

        return;

    }


    try {

        if (aiResult) {

            aiResult.style.display =
                "block";

        }

        if (aiBreed) {

            aiBreed.textContent =
                "Analyzing...";

        }

        if (aiConfidence) {

            aiConfidence.textContent =
                "Please wait.";

        }

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Analyzing...";

        }


        const modelURL =
            MODEL_URL +
            "model.json";

        const metadataURL =
            MODEL_URL +
            "metadata.json";


        const model =
            await tmImage.load(
                modelURL,
                metadataURL
            );


        const image =
            await createImageFromFile(
                file
            );


        const predictions =
            await model.predict(
                image
            );


        predictions.sort(
            function(a, b) {

                return (
                    b.probability -
                    a.probability
                );

            }
        );


        const best =
            predictions[0];


        const breed =
            best.className;


        const confidence =
            (
                best.probability *
                100
            ).toFixed(2);


        if (aiBreed) {

            aiBreed.textContent =
                breed;

        }


        if (aiConfidence) {

            aiConfidence.textContent =
                `Confidence: ${confidence}%`;

        }


        /*
           Store temporarily so saveAnimal()
           can save it to Firestore.
        */

        window.detectedBreed =
            breed;

        window.detectedConfidence =
            Number(
                confidence
            );


        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Animal";

        }


    } catch (error) {

        console.error(
            "AI recognition error:",
            error
        );


        if (aiBreed) {

            aiBreed.textContent =
                "Recognition failed";

        }


        if (aiConfidence) {

            aiConfidence.textContent =
                error.message;

        }


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Analyze Photo First";

        }

    }

}


/* ============================================================
   CREATE IMAGE FROM FILE
   ============================================================ */

function createImageFromFile(
    file
) {

    return new Promise(
        function(resolve, reject) {

            const image =
                new Image();


            image.onload =
                function() {

                    resolve(
                        image
                    );

                };


            image.onerror =
                function(error) {

                    reject(
                        error
                    );

                };


            image.src =
                URL.createObjectURL(
                    file
                );

        }
    );

}


/* ============================================================
   SAVE ANIMAL
   ============================================================ */

async function saveAnimal(event) {

    event.preventDefault();


    if (!selectedFarmer) {

        alert(
            "Please find and select the farmer first."
        );

        return;

    }


    if (
        !window.detectedBreed
    ) {

        alert(
            "Please analyze the animal photo first."
        );

        return;

    }


    const species =
        $("animalSpecies")
            ?.value;


    const animalId =
        $("animalTagId")
            ?.value
            ?.trim();


    const gender =
        $("animalGender")
            ?.value;


    const age =
        $("animalAge")
            ?.value;


    if (
        !species ||
        !animalId ||
        !gender ||
        !age
    ) {

        alert(
            "Please fill all animal details."
        );

        return;

    }


    const saveButton =
        $("saveAnimalBtn");


    try {

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving Animal...";

        }


        /*
           Animal is stored INSIDE the farmer:

           users
             └── farmer UID
                  └── livestock
                       └── animal document
        */

        const livestockRef =
            collection(
                db,
                "users",
                selectedFarmer.uid,
                "livestock"
            );


        await addDoc(
            livestockRef,
            {

                animalId:
                    animalId,

                species:
                    species,

                breed:
                    window.detectedBreed,

                confidence:
                    window.detectedConfidence,

                gender:
                    gender,

                age:
                    Number(age),

                customerId:
                    selectedFarmer.customerId ||
                    "",

                farmerId:
                    selectedFarmer.uid,

                farmerName:
                    selectedFarmer.name ||
                    selectedFarmer.fullName ||
                    "",

                state:
                    selectedFarmer.state ||
                    "",

                district:
                    selectedFarmer.district ||
                    "",

                registeredBy:
                    currentOfficial
                        ? currentOfficial.id
                        : "",

                registeredAt:
                    serverTimestamp(),

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "Animal saved successfully."
        );


        event.target.reset();


        const preview =
            $("animalPreview");

        if (preview) {

            preview.innerHTML = `
                <span>
                    📷 No photo selected
                </span>
            `;

        }


        const aiResult =
            $("aiResult");

        if (aiResult) {

            aiResult.style.display =
                "none";

        }


        window.detectedBreed =
            null;

        window.detectedConfidence =
            null;

        selectedFarmer =
            null;

        selectedAnimalPhoto =
            null;


        closeAddAnimal();


        await loadDashboardStats();

        await loadRecentAnimals();


    } catch (error) {

        console.error(
            "Animal saving error:",
            error
        );


        alert(
            "Unable to save animal: " +
            error.message
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Analyze Photo First";

        }

    }

}


/* ============================================================
   LOAD RECENT ANIMALS
   ============================================================ */

async function loadRecentAnimals() {

    const recentAnimals =
        $("recentAnimals");

    if (!recentAnimals) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collectionGroup(
                    db,
                    "livestock"
                )
            );


        const animals =
            snapshot.docs
                .map(
                    function(item) {

                        return {

                            id:
                                item.id,

                            ...item.data()

                        };

                    }
                )
                .sort(
                    function(a, b) {

                        const aDate =
                            getDateValue(
                                a.registeredAt ||
                                a.createdAt
                            );

                        const bDate =
                            getDateValue(
                                b.registeredAt ||
                                b.createdAt
                            );

                        return (
                            bDate -
                            aDate
                        );

                    }
                );


        allAnimals =
            animals;


        const recent =
            animals.slice(
                0,
                8
            );


        renderAnimals(
            recent
        );


    } catch (error) {

        console.error(
            "Recent animals error:",
            error
        );


        recentAnimals.innerHTML = `

            <div class="empty-table">

                ⚠️

                <p>
                    Unable to load animal records.
                </p>

            </div>

        `;

    }

}


/* ============================================================
   RENDER ANIMALS
   ============================================================ */

function renderAnimals(
    animals
) {

    const recentAnimals =
        $("recentAnimals");

    if (!recentAnimals) {

        return;

    }


    if (
        !animals ||
        !animals.length
    ) {

        recentAnimals.innerHTML = `

            <div class="table-header">

                <span>
                    Animal
                </span>

                <span>
                    Owner
                </span>

                <span>
                    Breed
                </span>

                <span>
                    Registered
                </span>

            </div>


            <div class="empty-table">

                🐄

                <p>
                    No animal registrations yet.
                </p>

            </div>

        `;

        return;

    }


    recentAnimals.innerHTML = `

        <div class="table-header">

            <span>
                Animal
            </span>

            <span>
                Owner
            </span>

            <span>
                Breed
            </span>

            <span>
                Registered
            </span>

        </div>


        ${animals.map(
            function(animal) {

                return `

                    <div
                        class="recent-row"
                        onclick="openAnimalDetailsById('${escapeHtml(
                            animal.id
                        )}')"
                        style="cursor:pointer"
                    >

                        <div
                            class="recent-animal"
                        >

                            <div
                                class="recent-animal-icon"
                            >

                                ${getAnimalEmoji(
                                    animal.species
                                )}

                            </div>


                            <span>

                                ${escapeHtml(
                                    animal.animalId ||
                                    animal.id ||
                                    "Animal"
                                )}

                            </span>

                        </div>


                        <span>

                            ${escapeHtml(
                                animal.farmerName ||
                                animal.customerId ||
                                "—"
                            )}

                        </span>


                        <span
                            class="recent-breed"
                        >

                            ${escapeHtml(
                                animal.breed ||
                                "Unknown"
                            )}

                        </span>


                        <span>

                            ${formatDate(
                                animal.registeredAt ||
                                animal.createdAt
                            )}

                        </span>

                    </div>

                `;

            }
        ).join("")}

    `;

}


/* ============================================================
   OPEN ANIMAL DETAILS
   ============================================================ */

function openAnimalDetails(
    animal
) {

    if (!animal) {

        return;

    }


    const modal =
        $("animalModal");

    if (!modal) {

        return;

    }


    const photo =
        animal.photoUrl
            ? `

                <img
                    src="${escapeHtml(
                        animal.photoUrl
                    )}"
                    alt="Animal"
                    style="
                        width:100%;
                        max-height:280px;
                        object-fit:contain;
                        border-radius:12px;
                    "
                >

            `
            : `

                <div
                    class="detail-placeholder"
                >
                    ${getAnimalEmoji(
                        animal.species
                    )}
                </div>

            `;


    modal.innerHTML = `

        <div class="modal-card animal-modal">

            <button
                type="button"
                class="close-btn"
                onclick="closeAnimalModal()"
            >
                ×
            </button>


            <div class="detail-photo">

                ${photo}

            </div>


            <h2>

                ${escapeHtml(
                    animal.animalId ||
                    "Animal Details"
                )}

            </h2>


            <p class="modal-subtitle">
                Livestock record
            </p>


            <div class="detail-grid">


                <div class="detail-item">

                    <small>
                        Species
                    </small>

                    <strong>
                        ${escapeHtml(
                            animal.species ||
                            "Unknown"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Breed
                    </small>

                    <strong>
                        ${escapeHtml(
                            animal.breed ||
                            "Unknown"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        AI Confidence
                    </small>

                    <strong>
                        ${
                            animal.confidence !==
                            undefined
                                ? escapeHtml(
                                    String(
                                        animal.confidence
                                    )
                                ) + "%"
                                : "—"
                        }
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Gender
                    </small>

                    <strong>
                        ${escapeHtml(
                            animal.gender ||
                            "Unknown"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Age
                    </small>

                    <strong>
                        ${
                            animal.age !==
                            undefined
                                ? escapeHtml(
                                    String(
                                        animal.age
                                    )
                                ) + " years"
                                : "—"
                        }
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Farmer
                    </small>

                    <strong>
                        ${escapeHtml(
                            animal.farmerName ||
                            animal.customerId ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        State
                    </small>

                    <strong>
                        ${escapeHtml(
                            animal.state ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        District
                    </small>

                    <strong>
                        ${escapeHtml(
                            animal.district ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <small>
                        Registered
                    </small>

                    <strong>
                        ${formatDate(
                            animal.registeredAt ||
                            animal.createdAt
                        )}
                    </strong>

                </div>


            </div>

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


window.openAnimalDetails =
    openAnimalDetails;


/* ============================================================
   OPEN ANIMAL BY ID
   ============================================================ */

function openAnimalDetailsById(
    animalId
) {

    const animal =
        allAnimals.find(
            function(item) {

                return item.id === animalId;

            }
        );


    if (animal) {

        openAnimalDetails(
            animal
        );

    }

}


window.openAnimalDetailsById =
    openAnimalDetailsById;


/* ============================================================
   VIEW ALL ANIMALS
   ============================================================ */

function viewAllAnimals() {

    showAnimals();

}


window.viewAllAnimals =
    viewAllAnimals;


/* ============================================================
   HELP REQUESTS
   ============================================================ */

async function loadHelpRequests() {

    const container =
        $("helpRequestsList");

    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="empty-state">

            <div>
                ⏳
            </div>

            <h4>
                Loading requests...
            </h4>

        </div>

    `;


    try {

        /*
           Farmer requests are expected in
           supportTickets.

           We load them without requiring a
           composite Firestore index.
        */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "supportTickets"
                )
            );


        allHelpRequests =
            snapshot.docs
                .map(
                    function(item) {

                        return {

                            id:
                                item.id,

                            ...item.data()

                        };

                    }
                )
                .sort(
                    function(a, b) {

                        return (
                            getDateValue(
                                b.createdAt
                            ) -
                            getDateValue(
                                a.createdAt
                            )
                        );

                    }
                );


        renderHelpRequests(
            allHelpRequests
        );


    } catch (error) {

        console.error(
            "Help requests error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <div>
                    ⚠️
                </div>

                <h4>
                    Unable to load requests
                </h4>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


window.loadHelpRequests =
    loadHelpRequests;


/* ============================================================
   RENDER HELP REQUESTS
   ============================================================ */

function renderHelpRequests(
    requests
) {

    const container =
        $("helpRequestsList");

    if (!container) {

        return;

    }


    if (
        !requests ||
        !requests.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    🆘
                </div>

                <h4>
                    No help requests
                </h4>

                <p>
                    There are currently no support requests.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        requests.map(
            function(request) {

                return `

                    <div
                        class="farmer-item"
                        onclick="openHelpRequest('${escapeHtml(
                            request.id
                        )}')"
                    >

                        <div
                            class="farmer-item-left"
                        >

                            <div
                                class="farmer-avatar"
                            >
                                🆘
                            </div>


                            <div
                                class="farmer-item-info"
                            >

                                <strong>

                                    ${escapeHtml(
                                        request.message ||
                                        "Support request"
                                    )}

                                </strong>


                                <small>

                                    ${escapeHtml(
                                        request.status ||
                                        "pending"
                                    )}

                                    ·

                                    ${formatDate(
                                        request.createdAt
                                    )}

                                </small>

                            </div>

                        </div>


                        <span
                            class="farmer-customer-id"
                        >

                            ${escapeHtml(
                                request.customerId ||
                                request.farmerName ||
                                request.officialName ||
                                "Request"
                            )}

                        </span>

                    </div>

                `;

            }
        )
        .join("");

}


/* ============================================================
   OPEN HELP REQUEST
   ============================================================ */

function openHelpRequest(
    requestId
) {

    const request =
        allHelpRequests.find(
            function(item) {

                return item.id === requestId;

            }
        );


    if (!request) {

        return;

    }


    const modal =
        $("helpRequestModal");

    const details =
        $("helpRequestDetails");


    if (!modal || !details) {

        alert(
            request.message ||
            "No request details."
        );

        return;

    }


    details.innerHTML = `

        <div class="detail-grid">


            <div class="detail-item">

                <small>
                    Farmer
                </small>

                <strong>
                    ${escapeHtml(
                        request.farmerName ||
                        request.customerId ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <small>
                    Status
                </small>

                <strong>
                    ${escapeHtml(
                        request.status ||
                        "pending"
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <small>
                    Date
                </small>

                <strong>
                    ${formatDate(
                        request.createdAt
                    )}
                </strong>

            </div>


        </div>


        <div
            style="
                margin-top:20px;
                padding:16px;
                background:#f5f7f5;
                border-radius:12px;
                line-height:1.6;
            "
        >

            ${escapeHtml(
                request.message ||
                "No message."
            )}

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );

}


window.openHelpRequest =
    openHelpRequest;


/* ============================================================
   CLOSE HELP REQUEST
   ============================================================ */

function closeHelpRequestModal() {

    const modal =
        $("helpRequestModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeHelpRequestModal =
    closeHelpRequestModal;


/* ============================================================
   ADVANCED STATISTICS
   ============================================================ */

async function openStatistics() {

    if (!currentOfficial) {

        alert(
            "Only authorized officials can access statistics."
        );

        return;

    }


    const modal =
        $("statisticsModal");

    if (!modal) {

        console.error(
            "statisticsModal not found."
        );

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    statisticsLoaded =
        false;


    showStatisticsLoading();


    await loadBreedStatistics();

}


window.openStatistics =
    openStatistics;


/* ============================================================
   CLOSE STATISTICS
   ============================================================ */

function closeStatistics() {

    const modal =
        $("statisticsModal");

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


window.closeStatistics =
    closeStatistics;


/* ============================================================
   STATISTICS LOADING
   ============================================================ */

function showStatisticsLoading() {

    const container =
        $("statisticsContent");

    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="statistics-empty">

            <div style="font-size:32px;">
                ⏳
            </div>

            <p>
                Loading livestock statistics...
            </p>

        </div>

    `;

}


/* ============================================================
   LOAD STATISTICS
   ============================================================ */

async function loadBreedStatistics() {

    try {

        const snapshot =
            await getDocs(
                collectionGroup(
                    db,
                    "livestock"
                )
            );


        const animals =
            snapshot.docs.map(
                function(item) {

                    return {

                        id:
                            item.id,

                        ...item.data()

                    };

                }
            );


        allAnimals =
            animals;


        statisticsLoaded =
            true;


        buildStatisticsUI(
            animals
        );


    } catch (error) {

        console.error(
            "Statistics loading error:",
            error
        );


        const container =
            $("statisticsContent");


        if (container) {

            container.innerHTML = `

                <div class="statistics-error">

                    <strong>
                        Unable to load statistics.
                    </strong>

                    <br><br>

                    ${escapeHtml(
                        error.message ||
                        "Unknown Firestore error."
                    )}

                </div>

            `;

        }

    }

}


/* ============================================================
   BUILD STATISTICS UI
   ============================================================ */

function buildStatisticsUI(
    animals
) {

    const container =
        $("statisticsContent");

    if (!container) {

        return;

    }


    if (!animals.length) {

        container.innerHTML = `

            <div class="statistics-empty">

                <div style="font-size:42px;">
                    🐄
                </div>

                <h3>
                    No livestock data available
                </h3>

                <p>
                    Statistics will appear here once
                    livestock records are registered.
                </p>

            </div>

        `;

        return;

    }


    const summary =
        calculateSummary(
            animals
        );


    const breedData =
        calculateBreedStatistics(
            animals
        );


    const stateData =
        calculateStateStatistics(
            animals
        );


    const speciesStateData =
        calculateSpeciesStateStatistics(
            animals
        );


    const breedStateData =
        calculateBreedStateStatistics(
            animals
        );


    container.innerHTML = `

        <!-- SUMMARY -->

        <div class="statistics-summary">


            <div class="statistics-card">

                <span>
                    🐄
                </span>

                <small>
                    Total Animals
                </small>

                <strong>
                    ${summary.total}
                </strong>

            </div>


            <div class="statistics-card">

                <span>
                    👨‍🌾
                </span>

                <small>
                    Farmers
                </small>

                <strong>
                    ${summary.farmers}
                </strong>

            </div>


            <div class="statistics-card">

                <span>
                    🐄
                </span>

                <small>
                    Cattle
                </small>

                <strong>
                    ${summary.cattle}
                </strong>

            </div>


            <div class="statistics-card">

                <span>
                    🐃
                </span>

                <small>
                    Buffalo
                </small>

                <strong>
                    ${summary.buffalo}
                </strong>

            </div>


            <div class="statistics-card">

                <span>
                    🧬
                </span>

                <small>
                    Breeds
                </small>

                <strong>
                    ${summary.breeds}
                </strong>

            </div>


            <div class="statistics-card">

                <span>
                    📍
                </span>

                <small>
                    States
                </small>

                <strong>
                    ${summary.states}
                </strong>

            </div>


        </div>


        <!-- BREED -->

        <section class="statistics-section">

            <div class="statistics-section-header">

                <h3>
                    🧬 Breed Distribution
                </h3>

                <p>
                    Registered livestock grouped by breed.
                </p>

            </div>


            <div class="statistics-list">

                ${renderStatisticsBars(
                    breedData
                )}

            </div>

        </section>


        <!-- STATE -->

        <section class="statistics-section">

            <div class="statistics-section-header">

                <h3>
                    📍 State Distribution
                </h3>

                <p>
                    Number of registered animals by state.
                </p>

            </div>


            <div class="statistics-list">

                ${renderStatisticsBars(
                    stateData,
                    true
                )}

            </div>

        </section>


        <!-- SPECIES BY STATE -->

        <section class="statistics-section">

            <div class="statistics-section-header">

                <h3>
                    🗺️ Species by State
                </h3>

                <p>
                    Cattle and buffalo distribution across states.
                </p>

            </div>


            <div class="statistics-table-wrapper">

                ${renderSpeciesStateTable(
                    speciesStateData
                )}

            </div>

        </section>


        <!-- BREED BY STATE -->

        <section class="statistics-section">

            <div class="statistics-section-header">

                <h3>
                    🧬 Breed by State
                </h3>

                <p>
                    Breed distribution across registered regions.
                </p>

            </div>


            <div class="statistics-table-wrapper">

                ${renderBreedStateTable(
                    breedStateData
                )}

            </div>

        </section>

    `;

}


/* ============================================================
   SUMMARY
   ============================================================ */

function calculateSummary(
    animals
) {

    let cattle = 0;

    let buffalo = 0;


    const farmers =
        new Set();


    const breeds =
        new Set();


    const states =
        new Set();


    animals.forEach(
        function(animal) {

            const species =
                normalize(
                    animal.species
                );


            if (
                species === "cattle" ||
                species === "cow"
            ) {

                cattle++;

            }


            if (
                species === "buffalo"
            ) {

                buffalo++;

            }


            const breed =
                cleanCategory(
                    animal.breed,
                    "Unknown"
                );


            breeds.add(
                breed
            );


            const state =
                cleanCategory(
                    animal.state ||
                    animal.ownerState ||
                    animal.farmerState,
                    "Unknown"
                );


            states.add(
                state
            );


            const farmer =
                animal.farmerId ||
                animal.customerId ||
                animal.ownerId ||
                animal.farmerName;


            if (farmer) {

                farmers.add(
                    String(
                        farmer
                    )
                );

            }

        }
    );


    return {

        total:
            animals.length,

        farmers:
            farmers.size,

        cattle,

        buffalo,

        breeds:
            breeds.size,

        states:
            states.size

    };

}


/* ============================================================
   BREED STATISTICS
   ============================================================ */

function calculateBreedStatistics(
    animals
) {

    const counts = {};


    animals.forEach(
        function(animal) {

            const breed =
                cleanCategory(
                    animal.breed,
                    "Unknown"
                );


            counts[breed] =
                (
                    counts[breed] ||
                    0
                ) + 1;

        }
    );


    return sortStatistics(
        counts
    );

}


/* ============================================================
   STATE STATISTICS
   ============================================================ */

function calculateStateStatistics(
    animals
) {

    const counts = {};


    animals.forEach(
        function(animal) {

            const state =
                cleanCategory(
                    animal.state ||
                    animal.ownerState ||
                    animal.farmerState,
                    "Unknown"
                );


            counts[state] =
                (
                    counts[state] ||
                    0
                ) + 1;

        }
    );


    return sortStatistics(
        counts
    );

}


/* ============================================================
   SPECIES BY STATE
   ============================================================ */

function calculateSpeciesStateStatistics(
    animals
) {

    const result = {};


    animals.forEach(
        function(animal) {

            const state =
                cleanCategory(
                    animal.state ||
                    animal.ownerState ||
                    animal.farmerState,
                    "Unknown"
                );


            const species =
                normalize(
                    animal.species
                );


            if (!result[state]) {

                result[state] = {

                    cattle: 0,

                    buffalo: 0,

                    other: 0

                };

            }


            if (
                species === "cattle" ||
                species === "cow"
            ) {

                result[state].cattle++;

            } else if (
                species === "buffalo"
            ) {

                result[state].buffalo++;

            } else {

                result[state].other++;

            }

        }
    );


    return Object.entries(
        result
    )
        .map(
            function(entry) {

                return {

                    state:
                        entry[0],

                    ...entry[1]

                };

            }
        )
        .sort(
            function(a, b) {

                const totalA =
                    a.cattle +
                    a.buffalo +
                    a.other;


                const totalB =
                    b.cattle +
                    b.buffalo +
                    b.other;


                return (
                    totalB -
                    totalA
                );

            }
        );

}


/* ============================================================
   BREED BY STATE
   ============================================================ */

function calculateBreedStateStatistics(
    animals
) {

    const result = {};


    animals.forEach(
        function(animal) {

            const state =
                cleanCategory(
                    animal.state ||
                    animal.ownerState ||
                    animal.farmerState,
                    "Unknown"
                );


            const breed =
                cleanCategory(
                    animal.breed,
                    "Unknown"
                );


            if (!result[state]) {

                result[state] = {};

            }


            result[state][breed] =
                (
                    result[state][breed] ||
                    0
                ) + 1;

        }
    );


    return Object.entries(
        result
    )
        .map(
            function(entry) {

                return {

                    state:
                        entry[0],

                    breeds:
                        entry[1]

                };

            }
        )
        .sort(
            function(a, b) {

                return (
                    totalObjectValues(
                        b.breeds
                    ) -
                    totalObjectValues(
                        a.breeds
                    )
                );

            }
        );

}


/* ============================================================
   SORT STATISTICS
   ============================================================ */

function sortStatistics(
    counts
) {

    return Object.entries(
        counts
    )
        .map(
            function(entry) {

                return {

                    name:
                        entry[0],

                    count:
                        entry[1]

                };

            }
        )
        .sort(
            function(a, b) {

                return (
                    b.count -
                    a.count
                );

            }
        );

}


/* ============================================================
   RENDER STATISTICS BARS
   ============================================================ */

function renderStatisticsBars(
    data,
    isState = false
) {

    if (
        !data ||
        !data.length
    ) {

        return `

            <div class="statistics-empty">

                No data available.

            </div>

        `;

    }


    const maximum =
        data[0].count;


    return data.map(
        function(item) {

            const percentage =
                maximum > 0
                    ? (
                        item.count /
                        maximum
                    ) * 100
                    : 0;


            return `

                <div
                    class="statistics-row"
                >

                    <div
                        class="statistics-row-header"
                    >

                        <strong>

                            ${escapeHtml(
                                item.name
                            )}

                        </strong>


                        <span>

                            ${item.count}

                        </span>

                    </div>


                    <div
                        class="statistics-bar"
                    >

                        <div
                            class="
                                statistics-bar-fill
                                ${
                                    isState
                                        ? "state-bar"
                                        : ""
                                }
                            "
                            style="
                                width:${percentage}%;
                            "
                        ></div>

                    </div>


                    <small>

                        ${percentage.toFixed(1)}%
                        of highest category

                    </small>

                </div>

            `;

        }
    ).join("");

}


/* ============================================================
   SPECIES STATE TABLE
   ============================================================ */

function renderSpeciesStateTable(
    data
) {

    if (
        !data ||
        !data.length
    ) {

        return `

            <div class="statistics-empty">

                No regional data available.

            </div>

        `;

    }


    return `

        <table
            class="statistics-table"
        >

            <thead>

                <tr>

                    <th>
                        State
                    </th>

                    <th>
                        Cattle
                    </th>

                    <th>
                        Buffalo
                    </th>

                    <th>
                        Other
                    </th>

                    <th>
                        Total
                    </th>

                </tr>

            </thead>


            <tbody>

                ${data.map(
                    function(item) {

                        const total =
                            item.cattle +
                            item.buffalo +
                            item.other;


                        return `

                            <tr>

                                <td>

                                    <strong>
                                        ${escapeHtml(
                                            item.state
                                        )}
                                    </strong>

                                </td>

                                <td>
                                    ${item.cattle}
                                </td>

                                <td>
                                    ${item.buffalo}
                                </td>

                                <td>
                                    ${item.other}
                                </td>

                                <td>

                                    <strong>
                                        ${total}
                                    </strong>

                                </td>

                            </tr>

                        `;

                    }
                ).join("")}

            </tbody>

        </table>

    `;

}


/* ============================================================
   BREED STATE TABLE
   ============================================================ */

function renderBreedStateTable(
    data
) {

    if (
        !data ||
        !data.length
    ) {

        return `

            <div class="statistics-empty">

                No breed data available.

            </div>

        `;

    }


    const breedSet =
        new Set();


    data.forEach(
        function(row) {

            Object.keys(
                row.breeds
            ).forEach(
                function(breed) {

                    breedSet.add(
                        breed
                    );

                }
            );

        }
    );


    const breeds =
        Array.from(
            breedSet
        ).sort();


    return `

        <table
            class="statistics-table"
        >

            <thead>

                <tr>

                    <th>
                        State
                    </th>


                    ${breeds.map(
                        function(breed) {

                            return `

                                <th>

                                    ${escapeHtml(
                                        breed
                                    )}

                                </th>

                            `;

                        }
                    ).join("")}


                    <th>
                        Total
                    </th>

                </tr>

            </thead>


            <tbody>

                ${data.map(
                    function(row) {

                        const total =
                            totalObjectValues(
                                row.breeds
                            );


                        return `

                            <tr>

                                <td>

                                    <strong>
                                        ${escapeHtml(
                                            row.state
                                        )}
                                    </strong>

                                </td>


                                ${breeds.map(
                                    function(breed) {

                                        return `

                                            <td>

                                                ${
                                                    row.breeds[
                                                        breed
                                                    ] || 0
                                                }

                                            </td>

                                        `;

                                    }
                                ).join("")}


                                <td>

                                    <strong>
                                        ${total}
                                    </strong>

                                </td>

                            </tr>

                        `;

                    }
                ).join("")}

            </tbody>

        </table>

    `;

}


/* ============================================================
   NORMALIZE
   ============================================================ */

function normalize(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


/* ============================================================
   CLEAN CATEGORY
   ============================================================ */

function cleanCategory(
    value,
    fallback
) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        return fallback;

    }


    const text =
        String(value).trim();


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* ============================================================
   TOTAL OBJECT VALUES
   ============================================================ */

function totalObjectValues(
    object
) {

    return Object.values(
        object || {}
    )
        .reduce(
            function(total, value) {

                return (
                    total +
                    Number(
                        value || 0
                    )
                );

            },
            0
        );

}


/* ============================================================
   REFRESH DASHBOARD
   ============================================================ */

async function refreshDashboard() {

    try {

        await loadDashboardStats();

        await loadFarmers();

        await loadRecentAnimals();

        alert(
            "Dashboard refreshed successfully."
        );

    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );

    }

}


window.refreshDashboard =
    refreshDashboard;


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {

    try {

        await signOut(
            auth
        );

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to logout."
        );

    }

}


window.logout =
    logout;


/* ============================================================
   CLOSE MODALS ON BACKDROP CLICK
   ============================================================ */

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList &&
            event.target.classList.contains(
                "modal"
            )
        ) {

            event.target.classList.add(
                "hidden"
            );

        }

    }
);


/* ============================================================
   ESC KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        document
            .querySelectorAll(
                ".modal:not(.hidden)"
            )
            .forEach(
                function(modal) {

                    modal.classList.add(
                        "hidden"
                    );

                }
            );

    }
);


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Pashu Parichay Official Portal loaded."
        );


        /*
           The animal form exists in HTML.
           Initialize it once.
        */

        setupAnimalForm();

    }
);
