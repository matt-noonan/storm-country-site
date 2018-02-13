In this post, I want to look at some straightforward examples of a seemingly-paradoxical truth:

<div class="alert alert-info">
It can be <strong>easier</strong> to prove a <strong>more abstract</strong> statement!
</div>

Since people often seem inclined to think `abstract == hard`, this may be a bit of a surprising
claim. How could a more abstract statement be *easier* to prove than a concrete one?

Let's think about a few cases where abstract beats concrete. We'll start in arithmetic, then work
our way over to geometry and, finally, software engineering.

# Simple arithmetic

Here is a claim about numbers that I would like you to prove:

```latex
865423174 \cdot 4824239984 = 4824239984 \cdot 865423174
```
A very concrete theorem, if there ever was one! How should we prove it? Concretely? That's
easy enough: just do the long multiplications on each side, and check that the results are
the same.

Is this proof really satisfactory? First of all, you had to do a bunch of nitty-gritty work
to complete the proof, calculating two long products (I hope you didn't make any mistakes
along the way!) Second, if I ask you the same question with two new numbers, you have to
start your work all over again. And finally, your proof (while perfectly sound) really
does not give much insight about what is going on.

But I bet you didn't actually compute that product. I *bet* you reasoned "I know that
multiplication of numbers is commutative, so $x \cdot y = y \cdot x$ for *any* numbers
$x$ and $y$. This equation is just a special case!"

And in fact, the [*proof* that multiplication of (natural) numbers is commutative](https://proofwiki.org/wiki/Natural_Number_Multiplication_is_Commutative) is
easy enough that you could work it out in *less time* than it would take to actually perform
the multiplication by hand!

So here we have an example of two theorems, a concrete one and an abstract one, where the
abstract theorem implies the concrete one *and* is easier to prove. Besides that, it is
more informative: the abstract formulation helps explain *why* the equation holds, not just
*that* it holds.

## More abstract implies "fewer" proofs

So this particular abstract statement happened to be easier to prove. Is this a general
phenomenon, or did I just pick a loaded example?

In some sense, we should not be surprised that more abstract statements are easier to prove.
We don't have a good, quantifiable metric for "easiness" of a proof, so let's try this approximation: we could say statement $A$ is "no harder to prove" than statement $B$ if every proof of
$B$ can be automatically converted to a proof of $A$.

There may be many different ways to prove the abstract statement $\forall x, y.~ x \cdot y = y \cdot x$. And each one of those proofs can *also* be used to prove that $865423174 \cdot 4824239984 = 4824239984 \cdot 865423174$. On the other hand, there may be *additional* ways to prove $865423174 \cdot 4824239984 = 4824239984 \cdot 865423174$ which will not generalize to proofs for all $x$ and $y$. That is, the abstract theorem is "no harder to prove" than the concrete one (and is, perhaps, "easier" too)

So there is a definite sense in which proving a more abstract statement may be simpler than
proving a concrete statement: there may just be fewer ways of proving the abstract statement!
In the concrete case, you may have a million ways that a proof could start. But in the abstract
case, you're often "on rails" to some extent, intentionally limiting the possible next steps your
proof could take.

By abstracting away irrelevant details, we're left with a smaller conceptual space to go searching
for a proof.

# The Pythagorean Theorem for Babies (and Other People)

The arithmetic example is a bit simplistic, so let's do something more fun.

The idea for this post actually came about while I was reading 
[The Pythagorean Theorem for Babies](https://www.amazon.com/gp/product/148200058X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=148200058X&linkCode=as2&tag=stormcountry-20&linkId=58ad006d1faeb800c40ee1862fdfb85b)<img src="//ir-na.amazon-adsystem.com/e/ir?t=stormcountry-20&l=am2&o=1&a=148200058X" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" /> with my kids. The author clearly did some good thinking about how to express the concepts behind the Pythagorean theorem in a simple way; for example, I love his definition of a right triangle:

<div class="alert alert-secondary">
There are many ways to make a triangle, but this book is about a special kind of triangle.
If you cut a rectangle in half like this [...], you get a shape called a right triangle.
A right triangle has three sides, just like any other triangle, but it's special because
a square fits perfectly into one of the corners.
</div>

I thought the *definition* of a right triangle as half a rectangle was pretty clever.
Anyway, the book goes on to prove the Pythagorean theorem using a pretty standard
dissection proof.
I've always found these a little unsatisfactory, since they involve the squares you care
about, plus some extra junk, and you have to do a bit of light accounting to show that the
extra junk is balanced.

All this got me thinking about how to present my favorite proof of the
Pythagorean theorem to my kids. And since *that* proof is an instance of "abstract is simple",
here we are! So, on to the proof.

## Similarities

First, we'll be making use of a certain non-trivial scale-invariance property of
Euclidean geometry. The property we care about is this:

<div class="alert alert-secondary">
<strong>Scaling lemma:</strong> Draw any two figures \(A\) and \(B\) in the plane. Now scale the entire plane by some
factor; after scaling, \(A\) and \(B\) will transform into some new figures \(A'\) and \(B'\). Then we
will have $$ \frac{\textsf{Area}(A)}{\textsf{Area}(A')} = \frac{\textsf{Area}(B)}{\textsf{Area}(B')}$$
</div>

Depending on your perspective, this statement may be any of

- obviously true by geometric arguments ([Theorem 8.4 here](http://www.ms.uky.edu/~droyster/courses/spring08/math6118/Classnotes/Chapter08.pdf) plus decomposition methods, roughly),

- obviously true by dimensional analysis (as in this [very nice survey of scaling methods](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&ved=0ahUKEwj20Ybtr5DZAhUDmVkKHa37A5wQFggsMAA&url=http%3A%2F%2Fwww.springer.com%2Fcda%2Fcontent%2Fdocument%2Fcda_downloaddocument%2F9781441996008-c1.pdf%3FSGWID%3D0-0-45-1145845-p174104667&usg=AOvVaw1fGC7U_QN_zUIG7d4O48UP) by
Amitabha Ghosh),

- not obvious at all (but nevertheless [true for Euclidean geometry](https://math.stackexchange.com/questions/23129/why-is-euclidean-geometry-scale-invariant)), or

- [actually false](https://en.wikipedia.org/wiki/Von_Neumann_paradox).

We'll gloss over these (very interesting!) details and simply assert the scaling lemma as
an axiom of Euclidean geometry, at least for "nice enough" figures.

## The Generalized Pythagorean Theorem

Recall the Pythagorean theorem that we all know and love (or perhaps just tolerate):
<div class="alert alert-secondary">
<strong>Theorem:</strong> Suppose a right triangle has side lengths \(a\), \(b\), and \(c\), where
\(c\) is the length of the longest side. Then $$ c^2 = a^2 + b^2 $$
</div>

We're going to collaborate to create a simple proof of a *generalized* Pythagorean theorem,
from which the traditional Pythagorean theorem will fall out immediately. Specifically, we'll
prove this:
<div class="alert alert-secondary">
<strong>Theorem:</strong> Suppose a right triangle has vertices \(A,B,C\), and a figure is
drawn on the edge \(\overline{AB}\). Copy the figure to the other two edges using similarity
transformations that move \(\overline{AB}\) to \(\overline{AC}\) and \(\overline{BC}\).
Then the area of the figure on the largest edge is equal to the sum of the areas of the two other
figures.
</div>

### Can you prove it?

Actually, even though I said "we're going to collaborate", *you* have to do the work
down below here. It's a bit of a puzzle; tinker around with the diagram below until the proof
is complete!

Drag triangle to move, or drag corners to rotate and resize. Click the edges to reflect
the attached shape. Use the menu to experiment with different shapes.

Remember what you're trying to prove: that the area of the figure on the long side is
equal to the sum of the areas of the figures on the other two sides. Once you've found
the right configuration, the proof will appear out of thin air!

<div class="alert alert-warning" role="alert" id="qed">
  <p><strong>Generalized Pythagorean Theorem:</strong>  Suppose a right triangle has vertices \(A,B,C\), and a figure is
drawn on the edge \(\overline{AB}\). Copy the figure to the other two edges using similarity
transformations that move \(\overline{AB}\) to \(\overline{AC}\) and \(\overline{BC}\).
Then the area of the figure on the largest edge is equal to the sum of the areas of the two other
figures. </p><p>
  <strong>Proof:</strong> By the scaling lemma, it is enough to prove this
  for any <em>specific</em> figure of our choosing. Why? Suppose we can prove the Generalized Pythagorean Theorem for *some specific* shape \(A\), so we know $$ \textsf{Area}(A) = \textsf{Area}(A') + \textsf{Area}(A'')$$ or, equivalently,
$$ 1 = \frac{\textsf{Area}(A')}{\textsf{Area}(A)} + \frac{\textsf{Area}(A'')}{\textsf{Area}(A)}$$
Now apply the scaling lemma, using <em>any other</em> shape \(B\), to get
$$ 1 = \frac{\textsf{Area}(B')}{\textsf{Area}(B)} + \frac{\textsf{Area}(B'')}{\textsf{Area}(B)}$$
or, equivalently,
$$ \textsf{Area}(B) = \textsf{Area}(B') + \textsf{Area}(B'')$$
</p>
<p>This means we only need to prove the theorem for <em>one</em> shape, <em>of our choosing</em>, and we get all other shapes for free.</p>
<p id="proof">Let's try to prove it for...</p>
  </p>
</div>
<div class="dropdown show">
  <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    Semi-circles
  </button>
  <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
  <a class="dropdown-item" id="shapeSemi" onclick="shape=semicircle; redraw(ctx);">
    Semi-circles
  </a>
  <a class="dropdown-item" id="shapeSquare" onclick="shape=square; redraw(ctx);">
     Squares
  </a>
  <a class="dropdown-item" id="shapePent" onclick="shape=pentomino; redraw(ctx);">
     Pentominos
  </a>
  <a class="dropdown-item" id="shapeEqui" onclick="shape=equilateral; redraw(ctx);">
     Equilateral △
  </a>
  <a class="dropdown-item" id="shapeSim" onclick="shape=similar; redraw(ctx);">
     Similar △
  </a>
  <a class="dropdown-item" id="shapeHex" onclick="shape=hexagon; redraw(ctx);">
     Hexagon
  </a>
  <a class="dropdown-item" id="shapeInv" onclick="shape=bitmap; redraw(ctx);">
     Invasion!
  </a>
  </div>
</div>
<canvas id="myCanvas" width=100 height=100 style="border:1px solid #000000;">Canvas not supported!</canvas>

<div class="invisible" id="postqed">
<div class="alert alert-success" role="alert">
  <p><strong>Corollary (Classical Pythagorean Theorem):</strong> If \(C\) is the length of the
  longest side of a right triangle, and \(A\), \(B\) are the lengths of the other two sides, then
  $$C^2 = A^2 + B^2$$
  </p><p>
  <strong>Proof:</strong> <span id="proof">This is a specific case of the Generalized
  Pythagorean Theorem, when the figures are squares.</span>
  </p>
</div>
</div>

# Abstraction in software engineering

A similar effect appears in software engineering, where *increasing* the amount of polymorphism in
a function's type *decreases* the number of possible implementations it may have. For example,
there are 16 functions of type $\texttt{Bool} \times \texttt{Bool} \to \texttt{Bool}$, but only *two*
functions of type $\forall T.~ T \times T \to T$.

## Polymorphism and testability

In programming languages that support parametric polymorphism, you can use this effect to
create lightweight unit tests that still offer guarantees about their normal, heavyweight
behavior.

For example, imagine that we have a program that carries out some algorithms on
certain graphs. Let's suppose these graphs are quite complex and heavyweight; they might
take a lot of space on disk, or have very expensive-to-compute neighbor functions, or maybe
they just are the result of a very long-running computation. Perhaps they are just difficult
to construct because of unwieldy APIs.

Now suppose that you have written a depth-first search algorithm for these graphs. It might
have a type something like this:

```haskell
dfs :: ExpensiveGraph -> List ExpensiveVertex
```

To write unit tests for `dfs`, you'll need to construct a bunch of `Graph`s to use as inputs.
Where will you get them? No option is really excellent; you first might build somes graphs as part of the test setup code, but they could be very expensive to compute on demand. So maybe you'll
set up some kind of cache or database, but you'll need to teach your test harness about it
(and hope it stays synchronized with the main code as versions change!). Building the graphs
by hand might be unpleasant if the APIs are difficult to use. And if the graphs are derived from
production data somehow, you'll need a test version of the database to work with.

All this to test a depth-first search algorithm? Why does this seem like overkill? Because all of
the testing artifacts are only there to get us some `ExpensiveGraph`s to work with; none of it
actually helps test the *implementation* of `dfs` at all!

Instead, let's follow the mantra of "abstract is simple", and *parameterize* `dfs` by the type
of graph we are working with! We could imagine introducing a generic graph type `Graph v`,
where `v` is the type of vertices in this graph. Then we would write something like

```haskell
data Graph v = ...

type ExpensiveGraph = Graph ExpensiveVertex

dfs :: Graph v -> List v
```

Now in our testing code, we can ignore `ExpensiveGraph` altogether, just like we ignored
squares to prove the Pythagorean theorem, and ignored numbers to prove that a certain product commuted! Instead, we can test `dfs` on some easily-constructed graph type. Parametric polymorphism
ensures that the behavior of `dfs` cannot vary for different choices of `v`, so we are free to
test `dfs` using whatever graph type we prefer!

# Summary

Abstraction sometimes gets cast in a negative light, as an academic tool that is
disengaged from concrete real-world domains like applied mathematics or software
engineering. But abstraction is a powerful tool exactly *because* it lets us deal with
concrete problems, giving us powerful tools for reasoning and understanding. Hone your
powers of abstraction while keeping one eye on the real-world problems you care about,
and reap the benefits!



