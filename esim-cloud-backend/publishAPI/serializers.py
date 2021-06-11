from django.db.models import fields
from rest_framework import serializers
from .models import CircuitTag, Project, Report, TransitionHistory, Field
from django.core.files.base import ContentFile
import base64
import six
import uuid
import imghdr
from saveAPI.serializers import StateSaveSerializer

class Base64ImageField(serializers.ImageField):

    def to_internal_value(self, data):
        if isinstance(data, six.string_types):
            if 'data:' in data and ';base64,' in data:
                header, data = data.split(';base64,')
            try:
                decoded_file = base64.b64decode(data)
            except TypeError:
                self.fail('invalid_image')
            file_name = str(uuid.uuid4())
            file_extension = imghdr.what(file_name, decoded_file)
            complete_file_name = "%s.%s" % (file_name, file_extension, )
            data = ContentFile(decoded_file, name=complete_file_name)

        return super(Base64ImageField, self).to_internal_value(data)


class CircuitTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = CircuitTag
        fields = ('tag', 'description', 'id')


class TransitionHistorySerializer(serializers.ModelSerializer):
    transition_author_name = serializers.CharField(
        read_only=True, source='transition_author.username')
    from_state_name = serializers.CharField(
        read_only=True, source='from_state.name')
    to_state_name = serializers.CharField(
        read_only=True, source='to_state.name')

    class Meta:
        model = TransitionHistory
        fields = ('transition_author_name',
                  'from_state_name',
                  'to_state_name',
                  'transition_time',
                  'reviewer_notes',
                  'is_done_by_reviewer')


class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = ('name', 'text')


class ProjectSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(read_only=True, source='state.name')
    author_name = serializers.CharField(
        read_only=True, source='author.username')
    fields = FieldSerializer(many=True)
    save_id = serializers.SerializerMethodField()
    saves = StateSaveSerializer(read_only=True,many=True,source='statesave_set')
    class Meta:
        model = Project
        fields = ('project_id',
                  'title',
                  'description',
                  'status_name',
                  'author_name',
                  'is_reported',
                  'fields',
                  'active_branch',
                  'active_version',
                  'save_id',
                  'saves'
                  )

    def get_save_id(self, obj):
        return obj.statesave_set.first().save_id

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('id', 'report_open', 'report_time',
                  'description', 'approved')


class ReportDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('description',)
