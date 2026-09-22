# Lesson 2 — SOLID Principles

SOLID is a set of five object-oriented design principles:

```text
S → Single Responsibility Principle
O → Open/Closed Principle
L → Liskov Substitution Principle
I → Interface Segregation Principle
D → Dependency Inversion Principle
```

Don’t try to memorize the names first. Focus on the **problem each principle solves**.

Today, let’s start with the most important one:

# 1. Single Responsibility Principle — SRP

A common definition is:

> A class should have only one reason to change.

That wording can feel confusing at first.

A simpler version is:

> **A class should have one main responsibility.**

---

## The bad design

Imagine we are building an employee system:

```java
class Employee {

    private String name;
    private double salary;

    public Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    public double calculateSalary() {
        return salary;
    }

    public void saveToDatabase() {
        System.out.println("Saving employee to database...");
    }

    public void generateReport() {
        System.out.println("Generating employee report...");
    }

    public void sendEmail() {
        System.out.println("Sending email to employee...");
    }
}
```

At first glance, this may look convenient.

Everything related to `Employee` is inside `Employee`.

But look at the responsibilities:

```text
Employee
├── stores employee information
├── calculates salary
├── talks to database
├── generates reports
└── sends emails
```

That is too much.

---

# Why is this a problem?

Different reasons could force this class to change.

For example:

The database team says:

> We are moving from MySQL to PostgreSQL.

`Employee` changes.

The finance team says:

> Salary calculation has changed.

`Employee` changes.

The reporting team says:

> Reports should now generate PDFs.

`Employee` changes.

The communication team says:

> Emails should use a new provider.

`Employee` changes.

So `Employee` has several unrelated **reasons to change**.

That violates SRP.

---

# Better design

Separate the responsibilities.

The employee entity:

```java
class Employee {

    private String name;
    private double salary;

    public Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    public String getName() {
        return name;
    }

    public double getSalary() {
        return salary;
    }
}
```

Salary calculation:

```java
class SalaryCalculator {

    public double calculate(Employee employee) {
        return employee.getSalary();
    }
}
```

Database responsibility:

```java
class EmployeeRepository {

    public void save(Employee employee) {
        System.out.println(
            "Saving " + employee.getName()
        );
    }
}
```

Report generation:

```java
class EmployeeReportGenerator {

    public void generate(Employee employee) {
        System.out.println(
            "Generating report for "
            + employee.getName()
        );
    }
}
```

Email:

```java
class EmployeeEmailService {

    public void sendEmail(Employee employee) {
        System.out.println(
            "Sending email to "
            + employee.getName()
        );
    }
}
```

Now:

```text
Employee
    → employee data

SalaryCalculator
    → salary calculations

EmployeeRepository
    → persistence

EmployeeReportGenerator
    → reports

EmployeeEmailService
    → communication
```

Each class has a focused responsibility.

---

# The deeper idea behind SRP

SRP does **not** mean:

> A class should contain only one method.

For example:

```java
class BankAccount {

    public void deposit(double amount) {}

    public void withdraw(double amount) {}

    public double getBalance() {
        return 0;
    }
}
```

This has three methods.

But all three are related to the same responsibility:

> Managing a bank account.

So this can still follow SRP.

---

# Responsibility vs method count

Consider:

```java
class Calculator {

    int add(int a, int b) {
        return a + b;
    }

    int subtract(int a, int b) {
        return a - b;
    }

    int multiply(int a, int b) {
        return a * b;
    }
}
```

Three methods.

One responsibility:

```text
Arithmetic operations
```

Perfectly reasonable.

Now:

```java
class Calculator {

    int add(int a, int b) {
        return a + b;
    }

    void saveUser() {}

    void sendEmail() {}
}
```

Also three methods.

But now there are three unrelated responsibilities.

That's poor cohesion.

Notice the connection with our previous lesson:

> **SRP encourages high cohesion.**

---

# Real-world example: Order system

Imagine this:

```java
class OrderService {

    public void createOrder() {
        // create order

        // validate payment

        // save order

        // send email

        // update inventory

        // generate invoice
    }
}
```

This method becomes huge.

Eventually:

```java
public void createOrder() {

    validateUser();

    validateProducts();

    calculatePrice();

    calculateTax();

    processPayment();

    updateInventory();

    saveOrder();

    generateInvoice();

    sendEmail();

    sendPushNotification();

    updateAnalytics();
}
```

You can already feel the problem.

`OrderService` is becoming the center of the universe.

---

# Better decomposition

We could have:

```text
OrderService
PaymentService
InventoryService
InvoiceService
NotificationService
OrderRepository
PricingService
```

Then:

```java
class OrderService {

    private PaymentService paymentService;
    private InventoryService inventoryService;
    private NotificationService notificationService;

    public void createOrder(Order order) {

        paymentService.process(order);

        inventoryService.reserve(order);

        notificationService.notify(order);
    }
}
```

Now `OrderService` mainly coordinates the order workflow.

That is much cleaner.

---

# Important nuance

Don't take SRP too far.

A beginner may see this:

```java
class User {

    private String name;

    public String getName() {
        return name;
    }
}
```

and think:

> "`getName()` and storing the name are two responsibilities. I need a UserNameGetter class."

No.

That would be overengineering.

Responsibilities should be separated at a **meaningful architectural level**.

---

# How do you identify responsibilities?

Ask:

> Who would request this code to change?

Consider:

```java
class Invoice {

    void calculateTotal() {}

    void printInvoice() {}

    void saveInvoice() {}
}
```

Who might request changes?

Accounting team:

```text
calculateTotal()
```

UI/reporting team:

```text
printInvoice()
```

Database/infrastructure team:

```text
saveInvoice()
```

Different actors → potentially different responsibilities.

That is a powerful way to think about SRP.

---

# Example: Before SRP

```java
class Invoice {

    private double amount;

    public Invoice(double amount) {
        this.amount = amount;
    }

    public double calculateTotal() {
        return amount * 1.10;
    }

    public void print() {
        System.out.println(
            "Invoice total: " + calculateTotal()
        );
    }

    public void save() {
        System.out.println(
            "Saving invoice to database"
        );
    }
}
```

Three responsibilities:

```text
business logic
presentation
persistence
```

---

# After SRP

Invoice:

```java
class Invoice {

    private double amount;

    public Invoice(double amount) {
        this.amount = amount;
    }

    public double getAmount() {
        return amount;
    }
}
```

Business logic:

```java
class InvoiceCalculator {

    public double calculateTotal(Invoice invoice) {
        return invoice.getAmount() * 1.10;
    }
}
```

Printing:

```java
class InvoicePrinter {

    public void print(double total) {
        System.out.println(
            "Invoice total: " + total
        );
    }
}
```

Persistence:

```java
class InvoiceRepository {

    public void save(Invoice invoice) {
        System.out.println(
            "Saving invoice..."
        );
    }
}
```

Usage:

```java
Invoice invoice = new Invoice(100);

InvoiceCalculator calculator =
        new InvoiceCalculator();

double total =
        calculator.calculateTotal(invoice);

InvoicePrinter printer =
        new InvoicePrinter();

printer.print(total);

InvoiceRepository repository =
        new InvoiceRepository();

repository.save(invoice);
```

Yes, there are more classes.

That is normal.

Good design often replaces:

```text
one giant complicated class
```

with:

```text
several small understandable classes
```

---

# Why SRP makes testing easier

Suppose calculation and database logic live together:

```java
class Invoice {

    double calculate() {
        // database
        // tax calculation
        // logging
    }
}
```

Testing `calculate()` might require:

```text
database
configuration
network
logging setup
```

But if calculation is isolated:

```java
class InvoiceCalculator {

    double calculate(double amount) {
        return amount * 1.10;
    }
}
```

Testing becomes trivial:

```java
InvoiceCalculator calculator =
        new InvoiceCalculator();

double result =
        calculator.calculate(100);

assert result == 110;
```

This is one major reason good design improves testability.

---

# SRP in controllers

Suppose you are using Spring Boot.

Bad:

```java
@RestController
class UserController {

    @PostMapping("/users")
    public void createUser() {

        // parse request

        // validate user

        // calculate subscription

        // save database

        // send email

        // generate analytics
    }
}
```

The controller is doing everything.

A better architecture:

```text
UserController
      ↓
UserService
      ↓
UserRepository
```

And perhaps:

```text
UserService
 ├── NotificationService
 ├── SubscriptionService
 └── AnalyticsService
```

The controller's responsibility is primarily:

> Handling HTTP requests/responses.

Business logic belongs elsewhere.

---

# A useful mental model

Think of a restaurant.

You wouldn't normally have one person responsible for:

```text
taking orders
cooking
cleaning
accounting
delivering food
managing inventory
```

You separate responsibilities.

Software works similarly.

---

# SRP and change

Here's the deeper reason we care.

Imagine:

```text
Class A
```

contains:

```text
payment logic
email logic
database logic
invoice logic
```

Changing payment behavior risks breaking:

```text
emails
database operations
invoices
```

because everything lives together.

When responsibilities are separated:

```text
PaymentService
EmailService
InvoiceService
OrderRepository
```

a payment change is largely isolated to:

```text
PaymentService
```

This reduces the **blast radius of changes**.

That's one of the central goals of software design.

---

# Common SRP mistake

You may see classes like:

```text
UserManager
OrderManager
ApplicationManager
SystemManager
UtilityManager
Helper
CommonUtils
```

These names can become warning signs.

For example:

```java
class UserManager {

    void createUser() {}

    void resetPassword() {}

    void exportCSV() {}

    void sendEmail() {}

    void uploadAvatar() {}

    void calculateSubscription() {}

    void logActivity() {}
}
```

The word:

```text
Manager
```

sometimes hides the fact that nobody knows what the class actually owns.

Not every `Manager` class is bad, but it's worth inspecting.

---

# Another warning sign: "and"

If you describe a class as:

> "This class validates users **and** sends emails **and** writes database records."

That often suggests multiple responsibilities.

A useful rule:

> If the description repeatedly needs the word **and**, inspect the class.

---

# Mini challenge

Consider:

```java
class ProductService {

    public void addProduct(Product product) {
        // validate product

        // save to database

        // send admin email

        // update search index

        // generate audit log
    }
}
```

Ask yourself:

```text
What responsibilities exist?
```

A reasonable decomposition could be:

```text
ProductValidator
ProductRepository
NotificationService
SearchIndexService
AuditService
```

with:

```java
class ProductService {

    private ProductValidator validator;
    private ProductRepository repository;
    private NotificationService notificationService;
    private SearchIndexService searchIndexService;

    public void addProduct(Product product) {

        validator.validate(product);

        repository.save(product);

        searchIndexService.index(product);

        notificationService.productAdded(product);
    }
}
```

Notice something subtle:

`ProductService` still calls several systems.

Does that violate SRP?

Not necessarily.

Its responsibility can be:

> Coordinating the product creation use case.

Coordination itself can be a valid responsibility.

---

# Interview question

An interviewer may ask:

> What is the Single Responsibility Principle?

A strong answer is:

> SRP states that a class should have one reason to change, meaning it should focus on one cohesive responsibility. For example, business logic, persistence, reporting, and notification concerns should generally be separated so that changes in one concern don't unnecessarily affect the others.

Better than simply saying:

> "A class should do one thing."

Because "one thing" can be vague.

---

# SRP summary

Remember:

```text
SRP
 │
 ├── One cohesive responsibility
 │
 ├── One primary reason to change
 │
 ├── High cohesion
 │
 ├── Smaller blast radius
 │
 ├── Easier testing
 │
 └── Easier maintenance
```

The core question:

> **Why might this class need to change?**

If you find many unrelated answers, the class probably has too many responsibilities.

---

# Lesson 3 preview — Open/Closed Principle

Now we reach one of the most important principles for understanding design patterns:

> **Software entities should be open for extension but closed for modification.**

In plain English:

> Add new behavior without constantly changing existing working code.

Remember our payment code?

```java
if (type.equals("CARD")) {
    ...
} else if (type.equals("PAYPAL")) {
    ...
} else if (type.equals("UPI")) {
    ...
}
```

Every new payment type requires modifying the existing class.

That's exactly the kind of problem the **Open/Closed Principle** addresses.

And once you understand OCP, patterns such as **Strategy, Factory, Decorator, Observer, State, and Command** start making much more sense.

That's the next step.
