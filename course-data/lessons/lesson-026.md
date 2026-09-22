# Lesson 26 — Mediator Pattern

The **Mediator Pattern** is used when many objects communicate with each other and those direct connections create a tangled web of dependencies.

The core idea is:

> Instead of objects talking directly to each other, they communicate through a central mediator.

Without Mediator:

```text
A ↔ B
A ↔ C
A ↔ D
B ↔ C
B ↔ D
C ↔ D
```

With Mediator:

```text
       A
       |
       v
B --> Mediator <-- C
       ^
       |
       D
```

The components become simpler because they don't need to know about one another.

---

# 1. Start with the problem

Imagine a UI dialog containing:

```text
UsernameTextBox
PasswordTextBox
RememberMeCheckbox
LoginButton
ErrorLabel
```

Suppose the login button should be enabled only when:

```text
username is not empty
AND
password is not empty
```

If the username changes, it may need to update:

```text
LoginButton
ErrorLabel
```

If the password changes, it may need to update:

```text
LoginButton
ErrorLabel
```

A naive design might make the components directly reference one another.

---

# 2. Bad direct coupling

```java
class UsernameTextBox {

    private LoginButton loginButton;
    private PasswordTextBox passwordBox;
    private ErrorLabel errorLabel;

    public void textChanged(
            String username) {

        if (!username.isBlank()
                && !passwordBox
                    .getText()
                    .isBlank()) {

            loginButton.enable();
        } else {

            loginButton.disable();
        }

        errorLabel.clear();
    }
}
```

Now `UsernameTextBox` knows about:

```text
LoginButton
PasswordTextBox
ErrorLabel
```

Then `PasswordTextBox` may also know about those objects.

The UI components become tightly coupled.

---

# 3. The dependency web grows

Add:

```text
TwoFactorCheckbox
CountryDropdown
CaptchaWidget
ForgotPasswordButton
LoadingSpinner
```

Now you may get:

```text
TextBox → Button
TextBox → Label
Checkbox → Button
Dropdown → TextBox
Button → Spinner
Spinner → Label
...
```

This becomes difficult to change.

A modification in one component can ripple through many others.

---

# 4. Mediator idea

Instead of:

```text
Component A
→ Component B
→ Component C
```

we do:

```text
Component A
     |
     v
  Mediator
   /    \
  v      v
B        C
```

Components report events to the Mediator.

The Mediator decides how the rest of the system should react.

---

# 5. Define the Mediator

```java
interface LoginMediator {

    void componentChanged(
        UiComponent component
    );
}
```

And a common component abstraction:

```java
interface UiComponent {
}
```

The exact interface can vary greatly by domain.

The key idea is central coordination.

---

# 6. Username component

```java
class UsernameTextBox
        implements UiComponent {

    private final LoginMediator mediator;

    private String text = "";

    public UsernameTextBox(
            LoginMediator mediator) {

        this.mediator = mediator;
    }

    public void setText(
            String text) {

        this.text = text;

        mediator.componentChanged(
            this
        );
    }

    public String getText() {
        return text;
    }
}
```

Notice:

`UsernameTextBox` no longer knows about:

```text
LoginButton
PasswordTextBox
ErrorLabel
```

It only knows:

```java
LoginMediator
```

---

# 7. Password component

```java
class PasswordTextBox
        implements UiComponent {

    private final LoginMediator mediator;

    private String text = "";

    public PasswordTextBox(
            LoginMediator mediator) {

        this.mediator = mediator;
    }

    public void setText(
            String text) {

        this.text = text;

        mediator.componentChanged(
            this
        );
    }

    public String getText() {
        return text;
    }
}
```

Again, no direct dependency on the login button.

---

# 8. Login button

```java
class LoginButton
        implements UiComponent {

    private boolean enabled;

    public void enable() {
        enabled = true;
    }

    public void disable() {
        enabled = false;
    }

    public boolean isEnabled() {
        return enabled;
    }
}
```

---

# 9. Concrete Mediator

```java
class LoginDialogMediator
        implements LoginMediator {

    private UsernameTextBox username;

    private PasswordTextBox password;

    private LoginButton loginButton;

    public void setUsername(
            UsernameTextBox username) {

        this.username = username;
    }

    public void setPassword(
            PasswordTextBox password) {

        this.password = password;
    }

    public void setLoginButton(
            LoginButton loginButton) {

        this.loginButton =
                loginButton;
    }

    @Override
    public void componentChanged(
            UiComponent component) {

        boolean valid =
                !username
                    .getText()
                    .isBlank()
                &&
                !password
                    .getText()
                    .isBlank();

        if (valid) {

            loginButton.enable();

        } else {

            loginButton.disable();
        }
    }
}
```

Now the coordination logic lives in one place.

---

# 10. Usage

```java
LoginDialogMediator mediator =
        new LoginDialogMediator();

UsernameTextBox username =
        new UsernameTextBox(
            mediator
        );

PasswordTextBox password =
        new PasswordTextBox(
            mediator
        );

LoginButton button =
        new LoginButton();
```

Register components:

```java
mediator.setUsername(username);

mediator.setPassword(password);

mediator.setLoginButton(button);
```

Now:

```java
username.setText("alice");
```

Mediator checks the form.

Then:

```java
password.setText("secret");
```

Mediator enables the button.

---

# 11. What changed?

Before:

```text
UsernameTextBox
→ PasswordTextBox
→ LoginButton
→ ErrorLabel
```

After:

```text
UsernameTextBox
      |
      v
   Mediator
      |
      v
LoginButton
```

The components don't need to know the full interaction graph.

---

# 12. Classic roles

Mediator typically has:

### Mediator

Defines communication/cooperation operations.

```java
interface Mediator
```

### Concrete Mediator

Coordinates the components.

```java
LoginDialogMediator
```

### Colleagues / Components

Objects that communicate through the Mediator.

```text
UsernameTextBox
PasswordTextBox
LoginButton
ErrorLabel
```

Conceptually:

```text
Component A
    \
Component B ---> Mediator
    /
Component C
```

---

# 13. The main problem Mediator solves

Mediator reduces:

> **many-to-many coupling**

Suppose there are `n` components.

Without Mediator, potential direct relationships can grow roughly toward:

```text
O(n²)
```

With a Mediator, each component generally needs one relationship:

```text
Component → Mediator
```

That simplifies the dependency graph significantly.

---

# 14. Example — chat room

A classic Mediator example is a chat room.

Suppose users communicate directly.

Bad:

```text
Alice knows Bob
Alice knows Charlie
Bob knows Charlie
Charlie knows Dave
...
```

Each user may need references to everyone else.

Instead:

```text
Alice
  \
   \
 ChatRoom
   /  \
 Bob  Charlie
```

Users communicate through the chat room.

---

# 15. Chat mediator interface

```java
interface ChatMediator {

    void sendMessage(
        String message,
        User sender
    );

    void addUser(
        User user
    );
}
```

---

# 16. User component

```java
abstract class User {

    protected final ChatMediator mediator;

    protected final String name;

    protected User(
            ChatMediator mediator,
            String name) {

        this.mediator = mediator;
        this.name = name;
    }

    public abstract void send(
        String message
    );

    public abstract void receive(
        String message
    );
}
```

---

# 17. Concrete user

```java
class ChatUser
        extends User {

    public ChatUser(
            ChatMediator mediator,
            String name) {

        super(mediator, name);
    }

    @Override
    public void send(
            String message) {

        System.out.println(
            name
            + " sends: "
            + message
        );

        mediator.sendMessage(
            message,
            this
        );
    }

    @Override
    public void receive(
            String message) {

        System.out.println(
            name
            + " receives: "
            + message
        );
    }
}
```

---

# 18. Chat room mediator

```java
class ChatRoom
        implements ChatMediator {

    private final List<User>
            users =
            new ArrayList<>();

    @Override
    public void addUser(
            User user) {

        users.add(user);
    }

    @Override
    public void sendMessage(
            String message,
            User sender) {

        for (User user : users) {

            if (user != sender) {

                user.receive(
                    message
                );
            }
        }
    }
}
```

Now users don't know one another directly.

---

# 19. Usage

```java
ChatMediator room =
        new ChatRoom();

User alice =
        new ChatUser(
            room,
            "Alice"
        );

User bob =
        new ChatUser(
            room,
            "Bob"
        );

User charlie =
        new ChatUser(
            room,
            "Charlie"
        );
```

Register:

```java
room.addUser(alice);
room.addUser(bob);
room.addUser(charlie);
```

Then:

```java
alice.send(
    "Hello everyone"
);
```

The room coordinates delivery.

---

# 20. Why isn't ChatRoom just Observer?

Good question.

Chat can look Observer-like because:

```text
one user sends
many users receive
```

But the intent differs.

Observer focuses on:

> Publisher notifies subscribers about events.

Mediator focuses on:

> Central object coordinates communication among peer objects.

In a chat room, users are peers, and the room governs their interaction.

---

# 21. Mediator vs Observer

Observer:

```text
Publisher
  |
  +--> Subscriber A
  +--> Subscriber B
```

The relationship is often:

```text
one-to-many notification
```

Mediator:

```text
A
 \
  Mediator
 /   |   \
B    C    D
```

The relationship is:

```text
many components communicating through one coordinator
```

Memory shortcut:

```text
Observer
= notification

Mediator
= coordination
```

---

# 22. They can work together

A Mediator could internally use Observer-style subscriptions.

For example:

```text
Component
→ mediator.publish(event)
→ registered component handlers
```

Patterns can overlap structurally.

Again, intent is what matters.

---

# 23. Example — air traffic control

This is another classic example.

Imagine aircraft:

```text
Plane A
Plane B
Plane C
Plane D
```

Without a mediator, planes might coordinate directly:

```text
A ↔ B
A ↔ C
A ↔ D
B ↔ C
...
```

That's dangerous and complex.

Instead:

```text
Plane A
    \
     \
Air Traffic Control
     /
    /
Plane B
```

Planes communicate through the control tower.

---

# 24. Control tower interface

```java
interface ControlTower {

    void requestLanding(
        Aircraft aircraft
    );

    void notifyTakeoff(
        Aircraft aircraft
    );
}
```

Aircraft:

```java
class Aircraft {

    private final ControlTower tower;

    private final String flightNumber;

    public Aircraft(
            ControlTower tower,
            String flightNumber) {

        this.tower = tower;
        this.flightNumber =
                flightNumber;
    }

    public void requestLanding() {

        tower.requestLanding(this);
    }

    public String
        getFlightNumber() {

        return flightNumber;
    }
}
```

The aircraft doesn't coordinate with other aircraft directly.

The tower owns interaction rules.

---

# 25. Why Mediator helps here

The mediator can understand global concerns such as:

```text
runway availability
landing order
priority flights
emergencies
weather restrictions
```

Individual planes don't need that global knowledge.

This is another important insight:

> Mediator is often useful when coordination requires system-wide context.

---

# 26. Mediator vs direct references

Without Mediator:

```java
class Button {

    private TextBox textBox;
    private Label label;
    private Checkbox checkbox;
}
```

With Mediator:

```java
class Button {

    private Mediator mediator;
}
```

This reduces direct dependencies.

But the complexity doesn't disappear.

It moves.

---

# 27. Complexity moves into the Mediator

This is important.

Mediator doesn't magically remove coordination complexity.

It centralizes it.

Before:

```text
complexity distributed across
many components
```

After:

```text
complexity concentrated
inside mediator
```

That's often better because there's one obvious place to understand interaction rules.

But it creates another risk.

---

# 28. God Mediator

A Mediator can become enormous:

```java
class ApplicationMediator {

    void handleLogin() {}
    void handlePayment() {}
    void updateDashboard() {}
    void sendEmail() {}
    void manageInventory() {}
    void updateProfile() {}
    void processRefund() {}
    ...
}
```

Now you've created a **God Object**.

That's a major Mediator smell.

---

# 29. Keep mediators focused

Better:

```text
LoginDialogMediator
CheckoutMediator
ChatRoomMediator
FlightControlMediator
```

Each mediator coordinates a cohesive set of collaborators.

Don't create:

```text
EverythingMediator
```

---

# 30. Mediator and SRP

Mediator can support SRP.

Components focus on themselves:

```text
TextBox
→ manages text

Button
→ manages button state

Checkbox
→ manages checked state
```

Mediator focuses on:

```text
coordination rules
```

That's a cleaner separation.

---

# 31. Mediator and DIP

Components can depend on:

```java
Mediator
```

rather than concrete peer classes.

For example:

```java
class TextBox {

    private final FormMediator mediator;
}
```

This reduces concrete coupling.

---

# 32. Mediator and OCP

Suppose we add:

```text
CaptchaWidget
```

The component can report changes to the mediator.

Existing components may not need modification.

However, the mediator itself might need changes to coordinate the new component.

So Mediator is not a magic OCP machine.

It often trades peer coupling for centralized change.

---

# 33. Mediator and LSP

If multiple mediator implementations exist:

```text
DesktopMediator
MobileMediator
TestingMediator
```

they should honor the same coordination contract.

As always, interfaces need stable behavioral expectations.

---

# 34. Mediator vs Facade

This comparison is very important.

Facade:

> Gives clients a simpler interface to a complex subsystem.

Mediator:

> Coordinates communication among objects inside a system.

Facade direction is generally:

```text
Client
   |
   v
Facade
   |
   v
Subsystem
```

Mediator direction is more:

```text
Component A
   \
    Mediator
   /
Component B
```

Facade is mainly an external entry point.

Mediator is mainly internal coordination.

---

# 35. Facade vs Mediator memory rule

```text
Facade
= simplify access

Mediator
= simplify communication
```

Facade clients usually know the Facade.

Subsystem components often don't need to know it.

With Mediator, participating components usually know the Mediator.

---

# 36. Example comparison

Facade:

```java
checkoutFacade.placeOrder(
    request
);
```

Client gets one easy API.

Mediator:

```java
textBox.changed();
```

Text box notifies mediator, which updates:

```text
button
label
checkbox
```

Different problem.

---

# 37. Mediator vs Chain of Responsibility

Chain:

```text
Request
  ↓
Handler A
  ↓
Handler B
  ↓
Handler C
```

Mediator:

```text
A
 \
  Mediator
 /   \
B     C
```

Chain manages request flow.

Mediator manages component interactions.

Memory shortcut:

```text
Chain
= sequential processing

Mediator
= centralized coordination
```

---

# 38. Mediator vs Command

Command packages:

```text
an action
```

Mediator coordinates:

```text
participants
```

For example:

```text
SendMessageCommand
```

might be executed, and then the:

```text
ChatMediator
```

decides who receives it.

They can work together naturally.

---

# 39. Mediator vs State

State asks:

> What behavior applies in the current lifecycle state?

Mediator asks:

> How should components coordinate?

A UI wizard might use:

```text
State
→ current wizard step
```

and:

```text
Mediator
→ coordinate buttons, fields, validation labels
```

Again, complementary patterns.

---

# 40. Mediator vs Strategy

Strategy:

```text
choose one algorithm
```

Mediator:

```text
coordinate many collaborators
```

Very different intent.

---

# 41. Example — smart home

Imagine devices:

```text
Lights
Thermostat
Blinds
Alarm
DoorLock
MotionSensor
```

Without Mediator, devices may know each other directly.

For example:

```text
MotionSensor → Light
Alarm → DoorLock
Thermostat → Blinds
```

As automation rules grow, coupling grows.

Instead:

```text
Devices
   |
   v
HomeAutomationMediator
```

The mediator handles scenarios such as:

```text
if motion detected at night:
    turn lights on

if alarm armed:
    lock doors
    close blinds

if away mode:
    lower thermostat
```

This centralizes coordination logic.

---

# 42. Domain service as mediator-like object

Not every Mediator needs to be named `Mediator`.

For example:

```java
class CheckoutCoordinator {

    private PaymentService payment;
    private InventoryService inventory;
    private ShippingService shipping;
}
```

may act mediator-like if its role is coordinating peer services.

Pattern names describe intent, not mandatory class names.

---

# 43. But don't overlabel orchestration

A normal application service:

```java
OrderService.placeOrder()
```

that calls several dependencies isn't automatically a textbook Mediator.

Mediator is most recognizable when:

```text
multiple peer objects otherwise
would need direct knowledge
of each other
```

and a central coordinator removes those connections.

---

# 44. UI is one of the strongest use cases

UI components naturally generate lots of interactions:

```text
field changes
button clicks
dropdown selections
validation
visibility
enable/disable logic
```

Without coordination, components quickly become coupled.

A dialog/controller/mediator can own interaction rules.

This is why Mediator is often easy to understand through UI examples.

---

# 45. Form example with more behavior

Suppose a shipping form contains:

```text
CountryDropdown
StateDropdown
PostalCodeField
SubmitButton
TaxLabel
```

Rules:

```text
US selected
→ enable StateDropdown

Canada selected
→ hide StateDropdown

postal code changed
→ recalculate tax

required fields complete
→ enable SubmitButton
```

Instead of components knowing these rules, the mediator can coordinate them.

---

# 46. Event-oriented mediator

A mediator can expose semantic events rather than generic component references.

For example:

```java
interface CheckoutMediator {

    void countryChanged(
        String country
    );

    void postalCodeChanged(
        String postalCode
    );

    void paymentMethodChanged(
        PaymentMethod method
    );
}
```

This is often clearer than:

```java
componentChanged(
    Object component
);
```

because the contract describes meaningful interactions.

---

# 47. Generic mediator can become type-check heavy

Bad:

```java
public void notify(
        Object sender,
        String event) {

    if (sender instanceof TextBox) {
        ...
    }

    if (sender instanceof Checkbox) {
        ...
    }

    if (event.equals("CHANGED")) {
        ...
    }
}
```

This can become messy.

Strongly typed mediator methods may be cleaner.

---

# 48. Prefer semantic messages

Instead of:

```java
mediator.notify(
    this,
    "EVENT_7"
);
```

prefer:

```java
mediator.loginCredentialsChanged();
```

or:

```java
mediator.userSelectedCountry(
    country
);
```

The interaction becomes much easier to understand.

---

# 49. Mediator and event bus

An event bus can sometimes act as a generalized mediator.

Components publish:

```text
CountryChanged
UserLoggedIn
ItemSelected
```

and other components subscribe.

But an event bus is more indirect.

Mediator usually contains explicit coordination logic.

Event bus:

```text
publish event
subscribers react independently
```

Mediator:

```text
component reports event
mediator decides coordinated reaction
```

---

# 50. Mediator vs event bus

Mediator:

```text
centralized logic
explicit coordination
known interaction rules
```

Event bus:

```text
decentralized reactions
looser coupling
harder-to-see control flow
```

Use the one that best matches the domain.

---

# 51. Example — multiplayer lobby

Players can:

```text
join
leave
ready up
change team
start game
```

If each player object directly updates other players and lobby state, coupling becomes messy.

A `LobbyMediator` can coordinate:

```text
player joins
→ update player list

player readies
→ check whether all ready

team changes
→ rebalance

all ready
→ start game
```

Again, global coordination belongs in one place.

---

# 52. Example — auction system

Bidders should not communicate directly.

Instead:

```text
Bidder A
   \
    AuctionMediator
   /
Bidder B
```

Mediator can:

```text
accept bid
update current highest bid
notify participants
close auction
```

This fits very naturally.

---

# 53. Example — railway signaling

Trains should not each coordinate all conflict rules directly.

A central mediator can understand:

```text
track occupancy
signal state
route conflicts
priority
```

Again, Mediator is useful when local objects need global coordination.

---

# 54. Mediator centralizes policy

This is a deeper point.

Components often know their own state:

```text
TextBox knows its text
Button knows enabled/disabled
Plane knows its position
```

Mediator knows interaction policy:

```text
when text changes,
what else should happen?

when runway requested,
who may proceed?
```

So:

```text
Component
= local knowledge

Mediator
= coordination knowledge
```

That's an excellent mental model.

---

# 55. Common mistake — putting component internals into mediator

Bad:

```java
mediator.usernameTextBox
        .internalBuffer
        .clear();
```

The mediator should coordinate through clean component APIs.

Otherwise you've merely moved coupling rather than reducing it.

---

# 56. Common mistake — mediator owns all business logic

Suppose:

```java
class CheckoutMediator {

    calculateTax();
    calculateDiscount();
    validateCard();
    reserveInventory();
    generateInvoice();
    sendEmail();
}
```

That's too much.

The Mediator should coordinate domain services, not necessarily implement every responsibility itself.

Better:

```java
class CheckoutMediator {

    private TaxService taxService;
    private PaymentService paymentService;
    private InventoryService inventoryService;
}
```

and delegate specialized work.

---

# 57. Common mistake — components bypass the mediator

Suppose most communication goes through:

```text
Mediator
```

but one component directly calls:

```java
otherComponent.update();
```

Now coupling starts creeping back.

If Mediator is the intended communication boundary, keep that rule consistent.

---

# 58. Common mistake — too many mediator callbacks

A giant interface like:

```java
interface Mediator {

    void event1();
    void event2();
    void event3();
    ...
    void event73();
}
```

may indicate the mediator covers too broad a domain.

Split it into focused mediators.

---

# 59. Common mistake — one mediator per two objects

If only two simple objects communicate:

```text
A → B
```

introducing:

```text
A → Mediator → B
```

may add unnecessary indirection.

Mediator earns its complexity when communication relationships are becoming tangled.

---

# 60. Common mistake — mediator as service locator

Bad:

```java
mediator.getPaymentService();
mediator.getDatabase();
mediator.getLogger();
```

Now the Mediator becomes a service locator.

That's not the point.

Components should ask the Mediator to coordinate interactions, not use it as a bag of dependencies.

---

# 61. Mediator and testability

Without Mediator, testing `UsernameTextBox` may require:

```text
LoginButton
PasswordTextBox
ErrorLabel
Checkbox
```

because it directly depends on them.

With Mediator:

```java
UsernameTextBox
```

depends on:

```java
LoginMediator
```

You can provide a fake mediator.

That simplifies component tests.

---

# 62. Testing mediator behavior

The Mediator itself can be tested as coordination logic.

For example:

```text
username empty
password filled
→ button disabled

username filled
password empty
→ button disabled

both filled
→ button enabled
```

This makes interaction rules explicit and testable in one place.

---

# 63. Mediator and changing UI rules

Suppose requirements change:

> Login button should also require acceptance of Terms & Conditions.

Without Mediator, you might need changes across several components.

With Mediator, you can add:

```text
TermsCheckbox
```

and modify the coordination rule centrally:

```java
boolean valid =
        usernameValid
        && passwordValid
        && termsAccepted;
```

Much easier to reason about.

---

# 64. Mediator can own component registration

Instead of setter methods:

```java
mediator.setUsername(...);
mediator.setPassword(...);
```

the Mediator may register components:

```java
mediator.register(
    ComponentType.USERNAME,
    username
);
```

or receive all dependencies through its constructor.

Constructor injection is often clearer when the component graph is known upfront.

---

# 65. Constructor-based mediator

For example:

```java
class LoginDialogMediator
        implements LoginMediator {

    private final UsernameTextBox username;
    private final PasswordTextBox password;
    private final LoginButton button;

    public LoginDialogMediator(
            UsernameTextBox username,
            PasswordTextBox password,
            LoginButton button) {

        this.username = username;
        this.password = password;
        this.button = button;
    }
}
```

But beware of circular construction if components themselves require the mediator.

You may need a factory/composition step.

---

# 66. Solving construction cycles

One option is:

```text
1. Create mediator
2. Create components with mediator
3. Register components with mediator
```

Another is to inject event callbacks instead of the mediator directly.

Another is to use a builder/factory to assemble the complete graph.

Construction is an implementation detail, not part of the pattern's essence.

---

# 67. Mediator with callbacks

Instead of a full Mediator interface, a component may receive a callback:

```java
class TextBox {

    private final Runnable onChange;

    ...
}
```

This is lighter but less expressive for rich coordination.

For a small UI interaction, callbacks may be enough.

For many peer relationships, Mediator becomes more valuable.

---

# 68. Mediator vs callbacks

Callbacks:

```text
good for simple one-off interaction
```

Mediator:

```text
good for a coordinated network
of interactions
```

Don't introduce a Mediator when one callback solves the problem cleanly.

---

# 69. Recognizing the pattern

Think Mediator when requirements sound like:

```text
"These objects all know too much
about one another."

"We have a web of many-to-many
dependencies."

"When one component changes,
several peers must react according
to coordination rules."

"We need one place to manage
interaction policy."

"Adding a new component causes
changes across many other components."
```

The strongest recognition question is:

> **Are many peer objects directly communicating in ways that create a tangled dependency graph?**

If yes, Mediator is a strong candidate.

---

# 70. Interview answer

If asked:

> What is the Mediator Pattern?

A strong answer is:

> Mediator is a behavioral design pattern that centralizes communication between a group of collaborating objects. Instead of components referencing and coordinating with each other directly, they communicate through a mediator, which reduces many-to-many coupling and keeps interaction rules in one place.

Then give an example:

> In a login dialog, username, password, validation label, and login button can communicate through a `LoginDialogMediator` rather than holding references to one another.

---

# 71. Mediator vs Observer interview answer

> Observer focuses on one-to-many event notification between a subject and subscribers, while Mediator coordinates communication among multiple peer objects. Observer distributes reactions, while Mediator centralizes interaction logic.

Memory shortcut:

```text
Observer = announce

Mediator = coordinate
```

---

# 72. Mediator vs Facade interview answer

> Facade provides a simplified external interface to a subsystem, while Mediator manages communication among objects within a subsystem. A Facade simplifies usage; a Mediator simplifies relationships.

Memory shortcut:

```text
Facade
= simpler entry point

Mediator
= simpler communication graph
```

---

# 73. Mediator vs Chain interview answer

> Chain of Responsibility passes a request sequentially through handlers, while Mediator acts as a central coordination hub among multiple components.

```text
Chain
A → B → C

Mediator
A → M ← B
    ↑
    C
```

---

# 74. Mediator vs Command interview answer

> Command encapsulates an action as an object, while Mediator coordinates how multiple objects interact. A component may send a Command to a Mediator or the Mediator may dispatch Commands as part of coordination.

---

# 75. Deep mental model

Think of a school classroom.

Without a teacher coordinating discussion:

```text
Student A talks to B
B talks to C
C talks to D
everyone talks over everyone
```

With a teacher acting as mediator:

```text
Student
   \
Teacher
   /
Student
```

The students don't need to independently manage every interaction.

The mediator knows the coordination rules.

---

# 76. The tradeoff

Mediator transforms:

```text
distributed coupling
```

into:

```text
centralized coordination
```

That's powerful.

But the cost is:

```text
mediator complexity
```

So the design tradeoff is:

> Is centralized coordination easier to understand than the existing network of direct relationships?

If yes, Mediator is likely useful.

---

# 77. Mental model

Remember:

```text
Component A
    \
     \
    Mediator
     /   \
    /     \
Component B
Component C
```

Components say:

> Something happened to me.

Mediator says:

> Based on that, here's what the other components should do.

That's Mediator.

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify subscribers

Command
→ package an action

State
→ lifecycle-dependent behavior

Template Method
→ fixed algorithm skeleton

Chain of Responsibility
→ pass request through handlers

Iterator
→ traverse a collection

Mediator
→ coordinate peer objects
```

A compact mental model:

```text
Strategy        = choose HOW

Observer        = notify WHO

Command         = package WHAT

State           = lifecycle

Template Method = fixed workflow

Chain           = processing pipeline

Iterator        = traversal

Mediator        = coordination
```

We now have only **3 classic behavioral patterns left**:

```text
Memento
Visitor
Interpreter
```

That means after Lesson 26, you've completed:

```text
5 / 5  Creational
7 / 7  Structural
8 / 11 Behavioral
```

So you're now at:

```text
20 / 23 GoF patterns complete
```

# Next: Lesson 27 — Memento Pattern

Memento solves the problem:

> How do we save an object's state so we can restore it later without exposing its internal implementation?

Imagine a text editor:

```text
Document state:
"Hello"
```

User edits:

```text
"Hello world"
```

Then presses:

```text
Undo
```

One approach is to expose every internal field and manually reconstruct old state.

That's bad encapsulation.

Memento instead creates a snapshot:

```text
Originator
   |
   | create snapshot
   v
Memento
```

Later:

```text
Memento
   |
   | restore
   v
Originator
```

Lesson 27 will cover **Originator, Memento, Caretaker, undo/redo, snapshots, immutable mementos, Memento vs Command, and memory tradeoffs when storing object history**.
