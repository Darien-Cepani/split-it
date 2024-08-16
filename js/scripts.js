let people = [];
let items = [];
let currentPerson = null;
let peopleSummaryTable, billSummaryTable;
let billStartDate;

function startNewBill() {
	document.getElementById("home-screen").classList.add("hidden");
	document.getElementById("bill-screen").classList.remove("hidden");
	openLocationModal();
	people = [];
	items = [];
	billStartDate = new Date();
	document.getElementById(
		"billDate"
	).textContent = `Bill started on: ${billStartDate.toLocaleString()}`;
	updatePeopleSummary();
	updateBillSummary();
	updateItemAssigneeDropdown();
	saveToLocalStorage();
}

function openLocationModal() {
	const modal = document.createElement("div");
	modal.className =
		"aboveAll locationModal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center";
	modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
            <h2 class="text-2xl font-semibold mb-4">Enter Location</h2>
            <input type="text" id="locationInput" placeholder="Enter location name" class="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600">
            <button onclick="setLocation()" class="bg-primary-light dark:bg-primary-dark hover:opacity-80 text-white font-bold py-2 px-4 rounded transition-all">
                Set Location
            </button>
        </div>
    `;
	document.body.appendChild(modal);
}

function setLocation() {
	const location = document.getElementById("locationInput").value;
	if (location) {
		billStartDate = new Date();
		document.getElementById(
			"billDate"
		).textContent = `Bill started on: ${billStartDate.toLocaleString()} @ ${location}`;
		document.querySelector(".locationModal").remove(); // Remove the modal
		document.getElementById("home-screen").classList.add("hidden");
		document.getElementById("bill-screen").classList.remove("hidden");
		saveToLocalStorage();
	}
}

function addPerson() {
	const name = document.getElementById("personName").value;
	if (name) {
		const personExists = people.some((person) => person.name === name);
		if (personExists) {
			showToast(`${name} already exists!`, "error");
		} else {
			people.push({ name, totalOwed: 0, balance: 0 });
			updatePeopleSummary();
			updateItemAssigneeDropdown();
			document.getElementById("personName").value = "";
			saveToLocalStorage();
			showToast(`${name} added successfully!`);
		}
	}
}

function removePerson(name) {
	people = people.filter((person) => person.name !== name);
	items = items.filter((item) => item.assignee !== name);
	updatePeopleSummary();
	updateBillSummary();
	updateItemAssigneeDropdown();
	saveToLocalStorage();
	showToast(`${name} removed from the bill.`, "error");
}

function addItem() {
	const name = document.getElementById("itemName").value;
	const price = parseFloat(document.getElementById("itemPrice").value);
	const quantity = parseInt(document.getElementById("itemQuantity").value);
	const assignee = document.getElementById("itemAssignee").value;

	if (name && price && quantity && assignee) {
		const total = price * quantity;
		items.push({ name, price, quantity, assignee, total });
		updateBillSummary();
		updatePeopleSummary();
		clearItemInputs();
		saveToLocalStorage();
		showToast(`${name} added to the bill!`);
	}
}

function clearItemInputs() {
	document.getElementById("itemName").value = "";
	document.getElementById("itemPrice").value = "";
	document.getElementById("itemQuantity").value = "";
}

function removeItem(name, assignee) {
	items = items.filter(
		(item) => !(item.name === name && item.assignee === assignee)
	);
	updateBillSummary();
	updatePeopleSummary();
	saveToLocalStorage();
	showToast(`${name} removed for ${assignee} from the bill.`, "error");
}

function updatePeopleSummary() {
	if (peopleSummaryTable) {
		peopleSummaryTable.destroy();
	}
	const table = document.getElementById("peopleSummary");
	const tbody = table.getElementsByTagName("tbody")[0];
	tbody.innerHTML = "";

	people.forEach((person) => {
		person.totalOwed = items
			.filter((item) => item.assignee.includes(person.name))
			.reduce((sum, item) => {
				const assignees = item.assignee.split(", ");
				return sum + item.total / assignees.length;
			}, 0);

		const row = tbody.insertRow();
		row.innerHTML = `
                <td class="p-2 editable" data-field="name">${person.name}</td>
                <td class="p-2">$${person.totalOwed.toFixed(2)}</td>
                <td class="p-2">$${person.balance.toFixed(2)}</td>
				<td class="p-2">$${person.totalOwed.toFixed(2) - person.balance.toFixed(2)}</td>
                <td class="p-2 flex flex-row">
                    <button onclick="openPaymentModal('${
						person.name
					}')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded transition-all mr-1">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                    <button onclick="removePerson('${
						person.name
					}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded transition-all">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
	});

	peopleSummaryTable = $(table).DataTable({
		paging: false,
		searching: false,
		info: false,
	});

	setupEditableFields(table, "people");
}

function updateBillSummary() {
	if (billSummaryTable) {
		billSummaryTable.destroy();
	}
	const table = document.getElementById("billSummary");
	const tbody = table.getElementsByTagName("tbody")[0];
	tbody.innerHTML = "";

	let totalBill = 0;

	items.forEach((item) => {
		const row = tbody.insertRow();
		row.innerHTML = `
            <td class="p-2 editable" data-field="name">${item.name}</td>
            <td class="p-2 editable" data-field="price">$${item.price.toFixed(
				2
			)}</td>
            <td class="p-2 editable" data-field="quantity">${item.quantity}</td>
            <td class="p-2 editable" data-field="assignee">${item.assignee}</td>
            <td class="p-2">$${item.total.toFixed(2)}</td>
            <td class="p-2">
                <button onclick="removeItem('${item.name}', '${
			item.assignee
		}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded transition-all">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
		totalBill += item.total;
	});

	billSummaryTable = $(table).DataTable({
		paging: false,
		searching: true,
		info: false,
		responsive: true,
		scrollX: true,
		scrollCollapse: true,
		autoWidth: false,
		columnDefs: [
			{ width: "25%", targets: 0 },
			{ width: "15%", targets: [1, 2, 3, 4] },
			{ width: "15%", targets: 5 },
		],
	});

	document.getElementById("billTotal").textContent = totalBill.toFixed(2);

	setupEditableFields(table, "items");
}

function closeBill() {
	document.getElementById("home-screen").classList.remove("hidden");
	document.getElementById("bill-screen").classList.add("hidden");
	people = [];
	items = [];
	localStorage.removeItem("splitItData");
}

function setupEditableFields(table, dataType) {
	table.addEventListener("dblclick", function (e) {
		const cell = e.target.closest(".editable");
		if (!cell) return;

		const text = cell.textContent;
		const field = cell.dataset.field;
		const input = document.createElement("input");
		input.value = text;
		cell.textContent = "";
		cell.appendChild(input);
		input.focus();

		input.addEventListener("blur", function () {
			const newValue = this.value;
			cell.textContent = newValue;
			updateData(
				dataType,
				cell.parentElement.rowIndex - 1,
				field,
				newValue
			);
		});

		input.addEventListener("keypress", function (e) {
			if (e.key === "Enter") {
				this.blur();
			}
		});
	});
}

function updateItemAssigneeDropdown() {
	const select = document.getElementById("itemAssignee");
	select.innerHTML = "";
	people.forEach((person) => {
		const option = document.createElement("option");
		option.value = person.name;
		option.textContent = person.name;
		select.appendChild(option);
	});
}

function openPaymentModal(personName) {
	currentPerson = people.find((p) => p.name === personName);
	document.getElementById("paidBy").innerHTML = currentPerson.name;
	document.getElementById("paymentModal").classList.remove("hidden");
	document.getElementById("paymentModal").classList.add("flex");
	document.getElementById("paymentAmount").value = "";
	document.getElementById("remainingAmount").textContent = "";
}

function closePaymentModal() {
	document.getElementById("paymentModal").classList.add("hidden");
}

function processPayment() {
	const paidAmount = parseFloat(
		document.getElementById("paymentAmount").value
	);
	if (paidAmount && currentPerson) {
		const remaining = paidAmount - currentPerson.totalOwed;
		document.getElementById("remainingAmount").textContent =
			remaining >= 0
				? `Refund: $${remaining.toFixed(2)}`
				: `Still owed: $${Math.abs(remaining).toFixed(2)}`;
		currentPerson.balance += paidAmount;
		updatePeopleSummary();
		saveToLocalStorage();
		showToast(
			`Payment of $${paidAmount.toFixed(2)} processed for ${
				currentPerson.name
			}`
		);
	}
}

function saveToLocalStorage() {
	const billDateElement = document.getElementById("billDate");
	const locationMatch = billDateElement.textContent.match(/ @ (.+)$/);
	const location = locationMatch ? locationMatch[1].trim() : null;

	localStorage.setItem(
		"splitItData",
		JSON.stringify({
			people,
			items,
			billStartDate,
			location,
		})
	);
}

function createShareableUrl() {
	// Retrieve the data from local storage
	const data = localStorage.getItem("splitItData");

	if (data) {
		// Encode the data to make it URL-safe
		const encodedData = encodeURIComponent(data);

		// Create a new URL with the data as a query parameter
		const baseUrl = window.location.origin + window.location.pathname;
		const shareableUrl = `${baseUrl}?data=${encodedData}`;

		console.log("Shareable URL:", shareableUrl);
		return shareableUrl;
	}
}

function loadFromLocalStorage() {
	const data = JSON.parse(localStorage.getItem("splitItData"));
	if (data) {
		people = data.people || [];
		items = data.items || [];
		billStartDate = new Date(data.billStartDate) || new Date();

		// Hide home screen and show bill screen
		document.getElementById("home-screen").classList.add("hidden");
		document.getElementById("bill-screen").classList.remove("hidden");

		// Update bill date display
		const billDateElement = document.getElementById("billDate");
		billDateElement.textContent = `Bill started on: ${billStartDate.toLocaleString()}`;
		if (data.location) {
			billDateElement.textContent += ` @ ${data.location}`;
		}

		updatePeopleSummary();
		updateBillSummary();
		updateItemAssigneeDropdown();
	}
}

window.addEventListener("load", () => {
	loadFromLocalStorage();
	loadThemePreference();
});

function showToast(message, status = "success") {
	const toast = document.getElementById("toast");
	const toastMessage = document.getElementById("toastMessage");
	if (status == "success") {
		toast.classList.add("bg-green-500");
	} else if (status == "error") {
		toast.classList.add("bg-red-500");
	}
	toastMessage.textContent = message;
	toast.classList.remove("hidden");
	toast.classList.add("opacity-100", "slide-in");
	setTimeout(() => {
		toast.classList.remove("opacity-100");
		toast.classList.add("opacity-0");
		setTimeout(() => {
			toast.classList.add("hidden");
			toast.classList.remove("slide-in");
		}, 300);
	}, 3000);
}

function downloadPDF() {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();

	// Add title and date
	doc.setFontSize(20);
	doc.text("SplitIt - Bill Summary", 14, 15);
	doc.setFontSize(12);
	doc.text(`Bill started on: ${billStartDate.toLocaleString()}`, 14, 25);

	// Add People Summary Table
	doc.setFontSize(16);
	doc.text("People Summary", 14, 35);
	const peopleHeaders = [["Name", "Total Owed", "Balance"]];
	const peopleData = people.map((person) => [
		person.name,
		`$${person.totalOwed.toFixed(2)}`,
		`$${person.balance.toFixed(2)}`,
	]);
	doc.autoTable({
		head: peopleHeaders,
		body: peopleData,
		startY: 40,
		theme: "grid",
	});

	// Add Bill Items Table
	doc.setFontSize(16);
	doc.text("Bill Items", 14, doc.lastAutoTable.finalY + 10);
	const itemHeaders = [["Item", "Price", "Quantity", "Assignee", "Total"]];
	const itemData = items.map((item) => [
		item.name,
		`$${item.price.toFixed(2)}`,
		item.quantity,
		item.assignee,
		`$${item.total.toFixed(2)}`,
	]);
	doc.autoTable({
		head: itemHeaders,
		body: itemData,
		startY: doc.lastAutoTable.finalY + 15,
		theme: "grid",
	});

	// Add total
	const totalBill = items.reduce((sum, item) => sum + item.total, 0);
	doc.setFontSize(14);
	doc.text(
		`Total Bill: $${totalBill.toFixed(2)}`,
		14,
		doc.lastAutoTable.finalY + 10
	);

	doc.save("SplitIt_Bill.pdf");
	showToast("PDF downloaded successfully!");
}

function shareBill() {
	const billData = JSON.stringify({ people, items, billStartDate });
	const encodedData = btoa(billData);
	const shareUrl = createShareableUrl();

	navigator.clipboard
		.writeText(shareUrl)
		.then(() => {
			showToast("Share link copied to clipboard!");
		})
		.catch((err) => {
			console.error("Failed to copy: ", err);
		});
}

// Dark mode toggle
const darkModeToggle = document.getElementById("darkModeToggle");

darkModeToggle.addEventListener("click", () => {
	document.documentElement.classList.toggle("dark");
	saveThemePreference();
});

function saveThemePreference() {
	localStorage.setItem(
		"theme",
		document.documentElement.classList.contains("dark") ? "dark" : "light"
	);
}

function loadThemePreference() {
	const theme = localStorage.getItem("theme");
	if (theme === "dark") {
		document.documentElement.classList.add("dark");
	}
}

// Mobile menu functionality
const mobileMenuButton = document.getElementById("mobileMenuButton");
const closeMenuButton = document.getElementById("closeMenuButton");
const navbarMenu = document.getElementById("navbarMenu");

mobileMenuButton.addEventListener("click", () => {
	navbarMenu.classList.add("show");
});

closeMenuButton.addEventListener("click", () => {
	navbarMenu.classList.remove("show");
});

// Close the mobile menu when a menu item is clicked
navbarMenu.addEventListener("click", (event) => {
	if (event.target.tagName === "A" || event.target.tagName === "BUTTON") {
		navbarMenu.classList.remove("show");
	}
});

// Initialize
window.addEventListener("load", () => {
	loadFromLocalStorage();
	loadThemePreference();
});

// Implement the interactive bubble animation
document.addEventListener("DOMContentLoaded", () => {
	const interBubble = document.querySelector(".interactive");
	let curX = 0;
	let curY = 0;
	let tgX = 0;
	let tgY = 0;

	const move = () => {
		curX += (tgX - curX) / 20;
		curY += (tgY - curY) / 20;
		interBubble.style.transform = `translate(${Math.round(
			curX
		)}px, ${Math.round(curY)}px)`;
		requestAnimationFrame(move);
	};

	window.addEventListener("mousemove", (event) => {
		tgX = event.clientX;
		tgY = event.clientY;
	});

	move();
});
