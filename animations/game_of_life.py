"""Small explanatory videos for the Game of Life chapters."""

from pathlib import Path

from manim import (
    Create,
    FadeIn,
    Scene,
    Square,
    Text,
    Transform,
    VGroup,
    Write,
    register_font,
)

FONT_FILE = Path(__file__).parent / "assets" / "fonts" / "OpenSans.ttf"
BACKGROUND = "#161923"
FOREGROUND = "#e3e5ef"
NEIGHBOR = "#72c8dc"
CENTER = "#edc36a"
OUTLINE = "#838aa2"


class NeighborhoodDiagram(Scene):
    """Count the eight surrounding cells without counting the center."""

    def construct(self):
        with register_font(str(FONT_FILE)):
            title = Text("Counting the neighbors", font="Open Sans", font_size=40, color=FOREGROUND)
            title.move_to([0, 3.1, 0])
            subtitle = Text(
                "Look around the center cell.",
                font="Open Sans", font_size=24, color=FOREGROUND,
            ).move_to([0, 2.5, 0])

            squares = {}
            for row in range(3):
                for column in range(3):
                    square = Square(side_length=0.95, color=OUTLINE, stroke_width=2)
                    square.set_fill(NEIGHBOR, opacity=0.08)
                    square.move_to([(column - 1) * 1.05, (1 - row) * 1.05, 0])
                    squares[column, row] = square

            center = squares[1, 1]
            center.set_fill(CENTER, opacity=1)
            center_label = Text(
                "center", font="Open Sans", font_size=20, color=BACKGROUND,
            ).move_to(center.get_center())
            count = Text(
                "Neighbors: 0", font="Open Sans", font_size=30, color=FOREGROUND,
            ).move_to([0, -2.2, 0])
            note = Text(
                "The center cell is not counted.",
                font="Open Sans", font_size=23, color=CENTER,
            ).move_to([0, -3.1, 0])

            self.play(Write(title), FadeIn(subtitle), run_time=0.8)
            self.play(Create(VGroup(*squares.values())), FadeIn(center_label), FadeIn(count), run_time=0.8)
            self.wait(0.5)

            neighbors = [
                (column, row)
                for row in range(3)
                for column in range(3)
                if (column, row) != (1, 1)
            ]
            for number, position in enumerate(neighbors, start=1):
                next_count = Text(
                    f"Neighbors: {number}", font="Open Sans", font_size=30, color=FOREGROUND,
                ).move_to(count.get_center())
                self.play(
                    squares[position].animate.set_fill(NEIGHBOR, opacity=0.85),
                    Transform(count, next_count),
                    run_time=0.45,
                )

            conclusion = Text(
                "8 surrounding neighbors", font="Open Sans", font_size=30, color=NEIGHBOR,
            ).move_to(count.get_center())
            self.play(Transform(count, conclusion), FadeIn(note), run_time=0.7)
            self.wait(1.6)
