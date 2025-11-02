import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      content:
        "Board exam stress was overwhelming me. This FREE platform helped me manage anxiety and family pressure. The counselors understood Indian student challenges perfectly.",
      author: "Anonymous Student",
      program: "12th Grade, Delhi",
      rating: 5,
    },
    {
      content:
        "My parents wanted me to be a doctor, but I wanted to pursue design. The counseling helped me communicate with my family and find my path - all completely free!",
      author: "Anonymous Student",
      program: "Engineering Student, Mumbai",
      rating: 5,
    },
    {
      content:
        "Hostel life was lonely and I felt homesick. The peer community connected me with students facing similar issues. Knowing it's all free made it accessible when I needed it most.",
      author: "Anonymous Student",
      program: "College Student, Bangalore",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gradient-wellness">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-4">
            Stories from Indian Students
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real experiences from Indian students who found FREE support through
            academic stress, family pressure, and career challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-3xl shadow-wellness hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-6">
                <Quote className="w-8 h-8 text-primary/30 mr-3" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>

              <blockquote className="text-muted-foreground mb-6 italic leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              <div className="border-t border-border/30 pt-4">
                <div className="font-medium text-foreground">
                  {testimonial.author}
                </div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.program}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-card rounded-full px-6 py-3 shadow-wellness">
            <div className="flex -space-x-2 mr-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gradient-hero rounded-full border-2 border-card"
                ></div>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">
                Join 10,000+ Indian students
              </span>
              <span className="text-muted-foreground">
                {" "}
                getting FREE mental health support
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
