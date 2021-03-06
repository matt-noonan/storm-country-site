---

A classic Haskell program is this one-liner to produce the Fibonacci numbers
(yes, *all* of them!):

```haskell
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)
```

XXXXXXXXX
On a whim, I grabbed a book about Euler's works that I picked up years ago
at the Joint Math Meetings. The book is terrific, full of little tidbits
digging into the theorems, techniques, and historical context of Euler's
works.

It so happened today that I opened to a short chapter about an article Euler
wrote on finding roots of polynomials. And the technique he proposed has a
surprisingly close relationship to the classic `fibs` one-liner! But to
make the connection, we're first going to take a little tour of Euler's
root-finding idea.

## The story begins...

Euler had previously discussed the problem of finding a series expansion
for *rational functions* (ratios of polynomials). Symbolically, he was
showing how to take two polynomials

$$ P(x) = a_0 + a_1 x + a_2 x^2 + \cdots + a_m x^m $$

$$ Q(x) = b_0 + b_1 x + b_2 x^2 + \cdots + b_n x^n $$

and from them, find the coefficients $c_i$ of a (usually infinite) series:

$$ \frac{a_0 + a_1 x + a_2 x^2 + \cdots + a_m x^m}{ b_0 + b_1 x + b_2 x^2 + \cdots + b_n x^n} = c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \cdots $$

To get a feel for this process, let's do a simple example: finding a series representation
of $(1 - x) / (1 - x^2)$. We want to find the values of  $c_0, c_1, c_2$  *etc* in order to make this equality hold:

$$ \frac{1 - x}{1 - x^2} = c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \cdots $$

Let's not bother with trying to remember tricks for simplification, or formulas for
ratios or reciprocals of polynomials;
let's just get in there and hack away! One tactic we could try is to multiply both sides by
 $1 - x^2$, with the goal of clearing the denominator:

$$ {1 - x} = (1 - x^2) \cdot (c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \cdots) $$

Next, being somewhat cavalier about convergence (in Eulerian fashion), we could forge ahead
and multiply out the
right-hand side of this equation, getting

$$ \begin{align*}
{1 - x} &=  (c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \cdots) - (c_0 x^2 + c_1 x^3 + c_2 x^5 + \cdots) \\
&= c_0 + c_1 x + (c_2 - c_0) x^2 + (c_3 - c_1) x^3 + (c_4 - c_2) x^4 + \cdots
\end{align*}
$$

Now we're getting somewhere! We can simply match up the corresponding coefficients for
each power of $x$ on the right and on the left (using 0 if there is no such term),
getting this infinite set of equations:

$$ \begin{align*}
1 &= c_0 \\
-1 &= c_1 \\
0 &= c_2 - c_0 \\
0 &= c_3 - c_1 \\
0 &= c_4 - c_2 \\
  & \vdots
\end{align*}
$$

from which it follows that $c_0 = 1, c_1 = -1, c_2 = 1, c_3 = -1$, and so on. Or
we could re-arrange the equations very slightly:

$$ \begin{align*}
1 &= c_0 \\
-1 &= c_1 \\
c_0 &= c_2 \\
c_1 &= c_3 \\
c_2 &= c_4 \\
  & \vdots
\end{align*}
$$

whereby we put on a Haskell-ese accent and conclude

```haskell
cs = 1 : -1 : cs
```

## Linear recurrences and reciprocal polynomials

Did you notice the nice, cyclic pattern that (eventually) appeared in the
coefficients of the infinite series? Was our example quirky, or will we
*always* end up with some nice pattern?

To help build intuition, let's do another polynomial-times-infinite-series
multiplication and see if we can find a common thread to pull on. This time,
we'll try to find an infinite series for $1 / (3 + 2x + 5x^2)$.
Proceeding as above, we end up with the equation

$$ 1 = (3 + 2x + 5x^2) \cdot (c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \cdots) $$

If we do the multiplication on the right-hand side, we get

$$
\begin{array}{cccccccccc}
3 c_0 & + & 3 c_1 x & + & 3 c_2 x^2 & + & 3 c_3 x^3 & + & 3 c_4 x^4 & + & \cdots \\
      & + & 2 c_0 x & + & 2 c_1 x^2 & + & 2 c_2 x^3 & + & 2 c_3 x^4 & + & \cdots \\
      &   &         & + & 5 c_0 x^2 & + & 5 c_1 x^3 & + & 5 c_2 x^4 & + & \cdots
\end{array}
$$

We can even write our entire equation in this form! Presto:

$$
\begin{array}{cccccccccc}
  &     1 & + &     0 x & + &     0 x^2 & + &     0 x^3 & + &     0 x^4 & + & \cdots \\
= & 3 c_0 & + & 3 c_1 x & + & 3 c_2 x^2 & + & 3 c_3 x^3 & + & 3 c_4 x^4 & + & \cdots \\
  &       & + & 2 c_0 x & + & 2 c_1 x^2 & + & 2 c_2 x^3 & + & 2 c_3 x^4 & + & \cdots \\
  &       &   &         & + & 5 c_0 x^2 & + & 5 c_1 x^3 & + & 5 c_2 x^4 & + & \cdots
\end{array}
$$

Now we see something pretty interesting. We can figure out $c_2$ from
$c_1$ and $c_0$  by looking at the $x^2$ column:

$$ 0 = 3 c_2 + 2 c_1 + 5 c_0 $$

And then by using the $x^3$ column, we can figure out $c_3$ from
$c_2$ and $c_1$:

$$ 0 = 3 c_3 + 2 c_2 + 5 c_1 $$

More generally, we can solve for any $c_k$ once we know $c_{k-1}$ and
$c_{k-2}$! Explicitly, we have

$$ c_k = -\frac{2}{3} c_{k-1} - \frac{5}{3} c_{k-2} $$

This is an example of a *linear recurrence*: a series where you can always compute
the next number by a linear combination of the previous few numbers. The classic
example is the Fibonacci numbers, where the linear recurrence is
$$F_n = F_{n-1} + F_{n-2}$$

The recurrence alone isn't quite enough to determine the series, of course. We also need
to kick things off with a few initial terms, in order to fuel our recurrence.

```haskell
coeffs = c0 : c1 : zipWith (\x y -> (-2 * x - 5 * y) / 3) coeffs (tail coeffs)
  where
    c0 = ...
    c1 = ...
```

We can compute the first two coefficients manually, by solving the first two columns of
the sum, leading to

```haskell
coeffs = c0 : c1 : zipWith (\x y -> (-2 * x - 5 * y) / 3) coeffs (tail coeffs)
  where
    c0 = 1/3
    c1 = -2/3
```

---