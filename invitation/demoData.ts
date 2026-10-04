import type { WeddingInvitationContent } from "./renderer/types";

export const previewWeddingDemoContent: WeddingInvitationContent = {
  heroImage: "/wedding-themes/shared/backgrounds/couple-hero-background.jpg",
  galleryImages: [
    "/wedding-themes/shared/photos/gallery-couple-confetti.jpg",
    "/wedding-themes/shared/photos/gallery-couple-backlight.jpg",
    "/wedding-themes/shared/photos/gallery-reception-table.jpg",
    "/wedding-themes/shared/photos/gallery-table-details.jpg",
  ],
  tagline: "Y si, elegimos celebrar este amor con ustedes.",
  family: {
    intro: "Con la bendicion de nuestras familias",
    groomParents: ["Carlos Mendoza", "Rosa Salinas"],
    brideParents: ["Jorge Torres", "Maria Elena Vargas"],
    godparents: ["Roberto Linares", "Patricia Vargas"],
    witnesses: ["Eduardo Castillo", "Lucia Rios"],
  },
  saveTheDate: {
    month: "Noviembre",
    day: "14",
    weekday: "Sabado",
    message:
      "Guarda esta fecha para acompaniarnos en el inicio de una historia que queremos celebrar cerca de quienes amamos.",
  },
  locations: [
    {
      kind: "Ceremonia religiosa",
      name: "Parroquia San Jose",
      date: "14 de noviembre de 2026",
      time: "5:00 p.m.",
      address: "Av. El Rosario 245, Lima",
      mapUrl: "https://maps.google.com",
      image: "/wedding-themes/shared/photos/ceremony-floral-table-1200x800.jpg",
    },
    {
      kind: "Recepcion",
      name: "Casa Hacienda Moreyra",
      date: "14 de noviembre de 2026",
      time: "7:30 p.m.",
      address: "Av. Paz Soldan 290, San Isidro",
      mapUrl: "https://maps.google.com",
      image: "/wedding-themes/shared/photos/reception-banquet-hall.jpg",
    },
  ],
  itinerary: [
    {
      time: "5:00 p.m.",
      title: "Ceremonia",
      description: "Nos encontramos para celebrar el si mas importante.",
    },
    {
      time: "7:30 p.m.",
      title: "Recepcion",
      description: "Cocktail de bienvenida y primeros brindis.",
    },
    {
      time: "9:00 p.m.",
      title: "Cena",
      description: "Una mesa preparada para compartir historias y alegria.",
    },
    {
      time: "10:30 p.m.",
      title: "Baile",
      description: "Abrimos la pista con nuestra cancion favorita.",
    },
  ],
  dressCode: {
    style: "Formal elegante",
    men: "Terno oscuro, camisa clara y zapatos formales.",
    women: "Vestido largo o cocktail en tonos suaves o profundos.",
    children: "Ropa formal comoda para acompanar la celebracion.",
    avoidColors: ["Blanco", "Marfil", "Rojo intenso"],
  },
  gifts: [
    {
      title: "Sobre",
      description:
        "Habra un buzon en la recepcion para quienes prefieran entregar un sobre.",
    },
    {
      title: "Yape",
      description: "Andrea Mendoza - 999 000 000",
    },
    {
      title: "Transferencia",
      description: "BCP - Cuenta de ahorros soles 194-1234567-0-12",
    },
  ],
  story: [
    {
      date: "2019",
      title: "Nos conocimos",
      description:
        "Una conversacion sencilla se convirtio en el comienzo de todo.",
      image: "/wedding-themes/versalles/photos/story-we-met-holding-hands.jpg",
    },
    {
      date: "2022",
      title: "Nuestro primer hogar",
      description:
        "Aprendimos que el amor tambien vive en los detalles de cada dia.",
      image: "/wedding-themes/versalles/photos/story-first-home-rose.jpg",
    },
    {
      date: "2025",
      title: "La propuesta",
      description:
        "Dijimos si con la certeza de querer caminar juntos lo que venga.",
      image: "/wedding-themes/versalles/photos/story-proposal-bouquet.jpg",
    },
  ],
  closingMessage:
    "Gracias por ser parte de esta historia.\nSu presencia hará que este día\nsea aún más nuestro.",
};
