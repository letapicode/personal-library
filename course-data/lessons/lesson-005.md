# Lesson 5 — Interface Segregation Principle

The **Interface Segregation Principle**, or **ISP**, says:

> Clients should not be forced to depend on methods they do not use.

In simpler terms:

> Prefer small, focused interfaces over large “do everything” interfaces.

The problem ISP solves is usually this:

```java
interface Worker {

    void work();

    void eat();

    void sleep();

    void drive();

    void writeCode();
}
```

At first, this looks convenient.

But now suppose we create:

```java
class Developer implements Worker {
    ...
}
```

A developer can:

```text
work
eat
sleep
writeCode
```

But `drive()` may make no sense.

Now:

```java
class TruckDriver implements Worker {
    ...
}
```

A truck driver can:

```text
work
eat
sleep
drive
```

But `writeCode()` probably makes no sense.

So both classes are being forced to implement behavior they don't need.

That's the problem.

---

# Bad design

Imagine this interface:

```java
interface Machine {

    void print();

    void scan();

    void fax();
}
```

A multifunction printer can implement everything:

```java
class MultiFunctionPrinter
        implements Machine {

    @Override
    public void print() {
        System.out.println("Printing");
    }

    @Override
    public void scan() {
        System.out.println("Scanning");
    }

    @Override
    public void fax() {
        System.out.println("Faxing");
    }
}
```

Fine.

But now consider a basic printer:

```java
class BasicPrinter
        implements Machine {

    @Override
    public void print() {
        System.out.println("Printing");
    }

    @Override
    public void scan() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void fax() {
        throw new UnsupportedOperationException();
    }
}
```

This is ugly.

The basic printer is forced to implement methods it cannot support.

That is an ISP violation.

---

# Better design

Split the interface based on capabilities:

```java
interface Printer {

    void print();
}
```

```java
interface Scanner {

    void scan();
}
```

```java
interface FaxMachine {

    void fax();
}
```

Now:

```java
class BasicPrinter
        implements Printer {

    @Override
    public void print() {
        System.out.println("Printing");
    }
}
```

And:

```java
class MultiFunctionPrinter
        implements Printer,
                   Scanner,
                   FaxMachine {

    @Override
    public void print() {
        System.out.println("Printing");
    }

    @Override
    public void scan() {
        System.out.println("Scanning");
    }

    @Override
    public void fax() {
        System.out.println("Faxing");
    }
}
```

Now every class implements only the capabilities it actually supports.

That's ISP.

---

# Why large interfaces become dangerous

Suppose we define:

```java
interface PaymentService {

    void pay();

    void refund();

    void schedulePayment();

    void generateInvoice();

    void exportReport();

    void sendReceipt();

    void calculateTax();
}
```

This interface is doing too much.

Maybe:

```text
CreditCardPayment
```

supports refunds.

But:

```text
GiftCardPayment
```

does not.

Maybe:

```text
BankTransferPayment
```

supports scheduled payments.

But:

```text
CashPayment
```

does not.

So implementations begin to look like this:

```java
class CashPayment
        implements PaymentService {

    @Override
    public void pay() {
        System.out.println("Cash payment");
    }

    @Override
    public void refund() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void schedulePayment() {
        throw new UnsupportedOperationException();
    }

    @Override
    public void generateInvoice() {
        throw new UnsupportedOperationException();
    }

    ...
}
```

This is a clear smell.

---

# Better payment design

Create smaller interfaces.

```java
interface Payable {

    void pay(double amount);
}
```

```java
interface Refundable {

    void refund(double amount);
}
```

```java
interface Schedulable {

    void schedule();
}
```

Now:

```java
class CreditCardPayment
        implements Payable, Refundable {

    @Override
    public void pay(double amount) {
        System.out.println("Card payment");
    }

    @Override
    public void refund(double amount) {
        System.out.println("Card refund");
    }
}
```

And:

```java
class CashPayment
        implements Payable {

    @Override
    public void pay(double amount) {
        System.out.println("Cash payment");
    }
}
```

Now the type tells you what the object can actually do.

That's much safer.

---

# ISP is about clients too

This part is important.

ISP is not just:

> "Make interfaces small."

It is about what **clients depend on**.

Suppose:

```java
interface EmployeeOperations {

    void calculateSalary();

    void generateReport();

    void resetPassword();

    void sendNotification();
}
```

Now imagine a payroll service:

```java
class PayrollService {

    private EmployeeOperations employeeOperations;
}
```

Payroll only needs:

```java
calculateSalary()
```

But because it depends on `EmployeeOperations`, it is also indirectly coupled to:

```text
reporting
password management
notifications
```

That is unnecessary coupling.

A better interface:

```java
interface SalaryCalculator {

    double calculateSalary(Employee employee);
}
```

Now:

```java
class PayrollService {

    private SalaryCalculator calculator;

    public PayrollService(
            SalaryCalculator calculator) {

        this.calculator = calculator;
    }
}
```

The client depends only on what it actually needs.

That's the deeper idea behind ISP.

---

# Big interface vs focused interfaces

Bad:

```text
                Worker
        -----------------------
        work
        eat
        sleep
        drive
        code
        manage
```

Every implementation sees everything.

Better:

```text
Workable
  └── work()

Codable
  └── code()

Drivable
  └── drive()

Manageable
  └── manage()
```

Then classes compose capabilities:

```text
Developer
  → Workable
  → Codable

TruckDriver
  → Workable
  → Drivable

Manager
  → Workable
  → Manageable
```

Much more precise.

---

# Robot example

This is a classic ISP example.

Suppose:

```java
interface Worker {

    void work();

    void eat();
}
```

Human:

```java
class HumanWorker
        implements Worker {

    @Override
    public void work() {
        System.out.println("Working");
    }

    @Override
    public void eat() {
        System.out.println("Eating");
    }
}
```

Now robot:

```java
class RobotWorker
        implements Worker {

    @Override
    public void work() {
        System.out.println("Robot working");
    }

    @Override
    public void eat() {
        throw new UnsupportedOperationException();
    }
}
```

Robot doesn't eat.

So the abstraction is wrong.

Better:

```java
interface Workable {

    void work();
}
```

```java
interface Eatable {

    void eat();
}
```

Human:

```java
class HumanWorker
        implements Workable, Eatable {

    public void work() {
        System.out.println("Working");
    }

    public void eat() {
        System.out.println("Eating");
    }
}
```

Robot:

```java
class RobotWorker
        implements Workable {

    public void work() {
        System.out.println("Robot working");
    }
}
```

Much better.

---

# ISP and LSP are closely connected

Notice what happened in Lesson 4.

We had:

```java
interface Storage {

    void read();

    void write();
}
```

Then:

```java
class ReadOnlyStorage
        implements Storage {

    public void read() {
        ...
    }

    public void write() {
        throw new UnsupportedOperationException();
    }
}
```

This causes an LSP problem because `ReadOnlyStorage` cannot fully honor the `Storage` contract.

ISP suggests the solution:

```java
interface ReadableStorage {

    String read();
}
```

```java
interface WritableStorage {

    void write(String data);
}
```

Then:

```java
class ReadOnlyStorage
        implements ReadableStorage {
}
```

And:

```java
class FullStorage
        implements ReadableStorage,
                   WritableStorage {
}
```

So ISP often prevents LSP violations.

That's an important connection.

---

# Fat interfaces

A large interface with many unrelated methods is sometimes called a:

> **Fat interface**

For example:

```java
interface UserService {

    void createUser();

    void deleteUser();

    void resetPassword();

    void generateInvoice();

    void uploadPhoto();

    void sendEmail();

    void exportCsv();

    void calculateTax();

    void createReport();
}
```

This interface is suspicious because it contains several unrelated responsibilities.

It may violate both:

```text
SRP
ISP
```

SRP because the abstraction represents too many responsibilities.

ISP because clients may be forced to depend on methods they don't need.

---

# Real-world example: cloud storage

Suppose:

```java
interface CloudStorage {

    void upload();

    void download();

    void delete();

    void share();

    void streamVideo();
}
```

Now imagine one implementation only supports archive storage:

```java
class ArchiveStorage
        implements CloudStorage {
```

Maybe it supports:

```text
upload
download
delete
```

but not:

```text
share
streamVideo
```

Then you'd have fake methods:

```java
@Override
public void streamVideo() {
    throw new UnsupportedOperationException();
}
```

This tells us the interface is too broad.

Better:

```java
interface Uploadable {

    void upload();
}
```

```java
interface Downloadable {

    void download();
}
```

```java
interface Shareable {

    void share();
}
```

```java
interface Streamable {

    void stream();
}
```

Then implementations choose the appropriate capabilities.

---

# Another example: media system

Bad:

```java
interface MediaPlayer {

    void playAudio();

    void playVideo();

    void displaySubtitles();

    void streamOnline();
}
```

Audio-only player:

```java
class Mp3Player
        implements MediaPlayer {

    public void playAudio() {
        ...
    }

    public void playVideo() {
        throw new UnsupportedOperationException();
    }

    public void displaySubtitles() {
        throw new UnsupportedOperationException();
    }

    public void streamOnline() {
        throw new UnsupportedOperationException();
    }
}
```

This is bad design.

Better:

```java
interface AudioPlayer {

    void playAudio();
}
```

```java
interface VideoPlayer {

    void playVideo();
}
```

```java
interface SubtitleSupport {

    void displaySubtitles();
}
```

```java
interface StreamingPlayer {

    void streamOnline();
}
```

An MP3 player only implements:

```java
AudioPlayer
```

while a streaming video player might implement:

```text
AudioPlayer
VideoPlayer
SubtitleSupport
StreamingPlayer
```

---

# Why ISP improves testing

Imagine a class only needs to send emails:

```java
class RegistrationService {

    private CommunicationService service;
}
```

where:

```java
interface CommunicationService {

    void sendEmail();

    void sendSms();

    void sendPush();

    void sendWhatsApp();

    void makePhoneCall();
}
```

To test `RegistrationService`, your mock must implement everything:

```java
class FakeCommunicationService
        implements CommunicationService {

    public void sendEmail() {
    }

    public void sendSms() {
    }

    public void sendPush() {
    }

    public void sendWhatsApp() {
    }

    public void makePhoneCall() {
    }
}
```

But your service only needs email.

Better:

```java
interface EmailSender {

    void sendEmail();
}
```

Now:

```java
class RegistrationService {

    private EmailSender emailSender;
}
```

Test double:

```java
class FakeEmailSender
        implements EmailSender {

    @Override
    public void sendEmail() {
    }
}
```

Simple.

Focused interfaces improve testability.

---

# A subtle point: don't make every interface tiny

ISP does **not** mean every interface must contain exactly one method.

This can be perfectly fine:

```java
interface Repository<T> {

    T findById(long id);

    void save(T entity);

    void delete(T entity);
}
```

Those operations are closely related.

The question is not:

> How many methods does the interface have?

The question is:

> Do the clients and implementations logically need these methods together?

That's the important distinction.

---

# Cohesion applies to interfaces too

Remember cohesion from Lesson 1?

A good interface should also have high cohesion.

This:

```java
interface OrderRepository {

    Order findById(long id);

    void save(Order order);

    void delete(Order order);
}
```

is cohesive.

This:

```java
interface OrderOperations {

    void saveOrder();

    void emailCustomer();

    void resizeImage();

    void calculateTax();

    void generatePdf();
}
```

is not.

So another way to understand ISP is:

> Keep interfaces cohesive around a focused capability.

---

# Role interfaces

A useful design idea is to think about interfaces as **roles**.

Instead of asking:

> "What can this object possibly do?"

ask:

> "What role does this client need from the object?"

Suppose a printer can:

```text
print
scan
fax
copy
email
```

But one client only prints.

That client should ideally depend on:

```java
Printer
```

not:

```java
AllInOneOfficeMachine
```

The object may have many abilities, but the client shouldn't necessarily know about all of them.

---

# Java standard library example

Java uses this idea frequently.

Consider:

```java
Iterable<T>
```

It provides the ability to:

```java
iterator()
```

Something that supports iteration can implement it.

Then:

```java
Collection<T>
```

provides collection operations.

Then:

```java
List<T>
```

provides list-specific operations.

Java doesn't put every possible collection capability into one gigantic interface.

Capabilities are layered and specialized.

That's related to ISP thinking.

---

# Spring-style example

Suppose your service depends on:

```java
interface UserRepository {

    User findById(long id);

    void save(User user);

    void delete(User user);

    void exportAllUsersToCsv();

    void sendNewsletter();

    void resetAllPasswords();
}
```

Something is wrong.

A repository should probably focus on persistence:

```java
interface UserRepository {

    User findById(long id);

    void save(User user);

    void delete(User user);
}
```

Export:

```java
interface UserExporter {

    void exportUsers();
}
```

Newsletter:

```java
interface NewsletterService {

    void sendNewsletter();
}
```

Password operations:

```java
interface PasswordService {

    void resetPassword(User user);
}
```

Now responsibilities and interfaces align.

---

# ISP and dependency direction

Suppose:

```java
class OrderService {

    private BigPaymentSystem paymentSystem;
}
```

where:

```java
interface BigPaymentSystem {

    void pay();

    void refund();

    void generateReport();

    void reconcile();

    void issueCredit();

    void exportLedger();

    void configureMerchant();
}
```

If `OrderService` only needs:

```java
pay()
```

then it should ideally depend on something smaller:

```java
interface PaymentProcessor {

    void pay();
}
```

Now the dependency is precise.

This becomes extremely important in large systems.

Why?

Because changing unrelated methods in a huge interface can affect many clients.

Small focused interfaces reduce that coupling.

---

# Signs you're violating ISP

Watch for these patterns:

```text
Methods with empty bodies
```

Example:

```java
@Override
public void fax() {
}
```

Or:

```text
UnsupportedOperationException
```

Example:

```java
@Override
public void scan() {
    throw new UnsupportedOperationException();
}
```

Or comments like:

```java
// not needed for this implementation
```

Or:

```java
// this class does not support this
```

Or implementations with dozens of meaningless methods.

Those are strong hints that the interface may be too large.

---

# Another warning sign: clients use only 10% of an interface

Suppose:

```java
interface CustomerPlatform {

    void createCustomer();

    void deleteCustomer();

    void updateCustomer();

    void generateReport();

    void exportData();

    void calculateAnalytics();

    void sendNotifications();

    void archiveCustomer();
}
```

And:

```java
class WelcomeService {

    private CustomerPlatform platform;
}
```

The only method it calls:

```java
platform.sendNotifications();
```

That dependency is too broad.

Better:

```java
interface CustomerNotifier {

    void sendNotification();
}
```

Then:

```java
class WelcomeService {

    private CustomerNotifier notifier;
}
```

Much cleaner.

---

# A design exercise

Consider:

```java
interface SmartDevice {

    void turnOn();

    void turnOff();

    void playMusic();

    void showVideo();

    void printDocument();

    void adjustTemperature();
}
```

Implementations:

```text
SmartSpeaker
SmartTV
SmartPrinter
SmartThermostat
```

Immediately there is a problem.

A thermostat shouldn't implement:

```text
printDocument()
playMusic()
showVideo()
```

A printer shouldn't implement:

```text
adjustTemperature()
```

So divide capabilities:

```java
interface Switchable {

    void turnOn();

    void turnOff();
}
```

```java
interface MusicPlayer {

    void playMusic();
}
```

```java
interface VideoDisplay {

    void showVideo();
}
```

```java
interface DocumentPrinter {

    void printDocument();
}
```

```java
interface TemperatureController {

    void adjustTemperature();
}
```

Then:

```text
SmartSpeaker
  → Switchable
  → MusicPlayer

SmartTV
  → Switchable
  → VideoDisplay

SmartPrinter
  → Switchable
  → DocumentPrinter

SmartThermostat
  → Switchable
  → TemperatureController
```

Much more accurate.

---

# Let's connect all four principles

We now have:

```text
S — Single Responsibility Principle

O — Open/Closed Principle

L — Liskov Substitution Principle

I — Interface Segregation Principle
```

Here's how they relate.

SRP asks:

> Does this class have one cohesive responsibility?

OCP asks:

> Can I add expected variations without constantly changing stable code?

LSP asks:

> Can every implementation safely honor the abstraction?

ISP asks:

> Is the abstraction forcing clients or implementations to depend on things they don't need?

These are deeply connected.

---

# Example combining them

Suppose:

```java
interface NotificationService {

    void sendEmail();

    void sendSms();

    void sendPush();

    void saveToDatabase();

    void generateReport();
}
```

Problems:

### SRP problem

This abstraction mixes:

```text
notification
persistence
reporting
```

### ISP problem

An SMS sender may not need:

```text
sendEmail()
generateReport()
```

### LSP problem

Implementations may throw:

```java
UnsupportedOperationException
```

for unsupported methods.

### OCP problem

Adding new notification mechanisms may require modifying a large central implementation.

A better design might be:

```java
interface NotificationSender {

    void send(String message);
}
```

Implementations:

```text
EmailSender
SmsSender
PushSender
WhatsAppSender
```

Now the design is simpler.

---

# Interview answer

If an interviewer asks:

> What is the Interface Segregation Principle?

A strong answer is:

> ISP states that clients should not be forced to depend on methods they do not use. Instead of creating large general-purpose interfaces, we should prefer smaller cohesive interfaces representing specific capabilities or roles.

Then give the printer example:

> Instead of one `Machine` interface with `print`, `scan`, and `fax`, define separate `Printer`, `Scanner`, and `FaxMachine` interfaces. A basic printer then implements only `Printer`, while a multifunction printer can implement all three.

Excellent interview answer.

---

# Mental model

Think:

```text
Bad:
one giant interface
      ↓
all implementations forced
to implement everything
```

Versus:

```text
Good:
small capability interfaces
      ↓
objects implement only
what they actually support
```

Or even simpler:

> **Don't make an object promise capabilities it doesn't have.**

---

# Mini challenge

Consider:

```java
interface Account {

    void deposit();

    void withdraw();

    void calculateInterest();

    void getLoan();

    void issueCreditCard();
}
```

Suppose you have:

```text
SavingsAccount
CheckingAccount
FixedDepositAccount
LoanAccount
```

Questions to think about:

1. Does every account support `withdraw()`?
2. Does every account calculate interest?
3. Does every account qualify for a loan?
4. Should `issueCreditCard()` really be an account responsibility?
5. Could these capabilities be separate interfaces?

You might eventually arrive at:

```java
interface Depositable {
    void deposit();
}
```

```java
interface Withdrawable {
    void withdraw();
}
```

```java
interface InterestBearing {
    double calculateInterest();
}
```

Then different account types implement only what applies.

That's ISP thinking.

---

# What you've learned

The key ISP ideas are:

```text
1. Avoid fat interfaces.

2. Clients should depend only on methods they need.

3. Implementations should not be forced to provide
   meaningless methods.

4. UnsupportedOperationException is often a warning sign.

5. Prefer cohesive capability-based interfaces.

6. Interface size alone is not the issue;
   responsibility and client needs matter.

7. ISP often prevents LSP violations.

8. Smaller interfaces reduce coupling and improve testing.
```

The sentence to remember is:

> **Depend on the smallest meaningful abstraction that gives you what you need.**

# Next: Lesson 6 — Dependency Inversion Principle

This is the final SOLID principle, and it ties almost everything together.

We'll answer questions like:

```text
Why should high-level business logic not directly depend
on MySQL, Stripe, Gmail, or file-system implementations?

Why do we use interfaces?

What exactly is Dependency Injection?

Why is constructor injection useful?

How does Spring's @Autowired relate to SOLID?

What's the difference between:
Dependency Inversion
Dependency Injection
and Inversion of Control?
```

We'll start with code like:

```java
class OrderService {

    private MySQLDatabase database =
            new MySQLDatabase();

    private StripePaymentGateway gateway =
            new StripePaymentGateway();
}
```

and transform it into a flexible, testable architecture.

**Lesson 6 — Dependency Inversion Principle** is where the SOLID ideas really start coming together.
