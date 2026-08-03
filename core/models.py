from django.db import models

class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    language = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    github_url = models.URLField(blank=True)
    branch = models.CharField(max_length=100, default="main")
    def __str__(self):
        return self.name